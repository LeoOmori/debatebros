import {
  createTextStreamResponse,
  streamText,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import { expectedSpeaker } from "@/domain";
import {
  debateModelId,
  debateProviderOptions,
  google,
} from "@/ai/google";
import {
  hasGeminiConfiguration,
  isMockAiMode,
  jsonError,
  requestErrorResponse,
  readJsonBody,
} from "@/ai/http";
import { buildCharacterInstructions, buildCharacterPrompt } from "@/ai/prompts";
import { acquireAiRequest } from "@/ai/guard";
import { logAiUsage } from "@/ai/observability";
import { characterTurnRequestSchema } from "@/ai/schemas";
import { rebuildValidatedSession } from "@/ai/session";
import { generateMockCharacterTurn } from "@/lib/mock-debate";

export const maxDuration = 35;

export async function POST(request: Request): Promise<Response> {
  const startedAt = performance.now();
  let releaseGuard: (() => void) | undefined;
  try {
    const body = characterTurnRequestSchema.parse(await readJsonBody(request));
    const session = rebuildValidatedSession(body.session);

    if (expectedSpeaker(session.stage) !== "character") {
      return jsonError("O personagem não pode falar nesta etapa.", 409);
    }

    const guard = acquireAiRequest(
      request,
      "debate-turn",
      `${session.id}:${session.stage}`,
    );
    releaseGuard = guard.release;

    if (isMockAiMode()) {
      const text = await generateMockCharacterTurn(session);
      releaseGuard();
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-AI-Mode": "mock",
        },
      });
    }

    if (!hasGeminiConfiguration()) {
      return jsonError(
        "A chave do Gemini ainda não foi configurada no servidor.",
        503,
      );
    }

    const result = streamText({
      model: google(debateModelId),
      instructions: buildCharacterInstructions(session),
      prompt: buildCharacterPrompt(session),
      temperature: 0.75,
      maxOutputTokens: 420,
      abortSignal: request.signal,
      timeout: {
        totalMs: 30_000,
        firstChunkMs: 12_000,
        chunkMs: 8_000,
      },
      providerOptions: debateProviderOptions,
      onError({ error }) {
        console.error("Gemini debate stream failed", error);
      },
      onEnd({ usage, finishReason }) {
        logAiUsage({
          operation: "debate-turn",
          sessionId: session.id,
          model: debateModelId,
          usage,
          durationMs: performance.now() - startedAt,
          finishReason,
        });
      },
    });

    return createTextStreamResponse({
      stream: failClosedTextStream(result.stream, releaseGuard),
      headers: {
        "Cache-Control": "no-store",
        "X-AI-Mode": "gemini",
        "X-AI-Model": debateModelId,
      },
    });
  } catch (error) {
    releaseGuard?.();
    return requestErrorResponse(error);
  }
}

function failClosedTextStream(
  stream: ReadableStream<TextStreamPart<ToolSet>>,
  release: () => void,
): ReadableStream<string> {
  return stream.pipeThrough(
    new TransformStream<TextStreamPart<ToolSet>, string>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          controller.enqueue(part.text);
        } else if (part.type === "error") {
          release();
          controller.error(new Error("Gemini stream failed"));
        } else if (part.type === "abort") {
          release();
          controller.error(new Error("Gemini stream aborted"));
        }
      },
      flush() {
        release();
      },
    }),
  );
}
