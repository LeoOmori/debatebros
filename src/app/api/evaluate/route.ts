import { generateText, Output } from "ai";
import { completeDebate } from "@/domain";
import {
  google,
  judgeFallbackProviderOptions,
  judgeFallbackModelId,
  judgeModelId,
  judgeProviderOptions,
} from "@/ai/google";
import {
  hasGeminiConfiguration,
  isAvailabilityError,
  isMockAiMode,
  jsonError,
  requestErrorResponse,
  readJsonBody,
} from "@/ai/http";
import { buildJudgeInstructions, buildJudgePrompt } from "@/ai/prompts";
import { acquireAiRequest } from "@/ai/guard";
import { logAiUsage } from "@/ai/observability";
import {
  debateEvaluationSchema,
  evaluationRequestSchema,
  judgeOutputSchema,
  normalizeEvaluation,
} from "@/ai/schemas";
import { rebuildValidatedSession } from "@/ai/session";
import { generateMockEvaluation } from "@/lib/mock-debate";

export const maxDuration = 50;

export async function POST(request: Request): Promise<Response> {
  const startedAt = performance.now();
  let releaseGuard: (() => void) | undefined;
  try {
    const body = evaluationRequestSchema.parse(await readJsonBody(request));
    const session = rebuildValidatedSession(body.session);

    if (session.stage !== "judging") {
      return jsonError("O debate ainda não está pronto para avaliação.", 409);
    }

    const guard = acquireAiRequest(request, "evaluation", `${session.id}:judging`);
    releaseGuard = guard.release;

    if (isMockAiMode()) {
      const evaluation = debateEvaluationSchema.parse(
        await generateMockEvaluation(session),
      );
      completeDebate(session, evaluation, new Date().toISOString());
      releaseGuard();
      return Response.json(
        { evaluation, usage: null, model: "mock" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!hasGeminiConfiguration()) {
      return jsonError(
        "A chave do Gemini ainda não foi configurada no servidor.",
        503,
      );
    }

    const instructions = buildJudgeInstructions(session);
    const prompt = buildJudgePrompt(session);
    const abortSignal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(45_000),
    ]);
    let activeModelId = judgeModelId;
    const result = await generateEvaluation(
      activeModelId,
      instructions,
      prompt,
      abortSignal,
      2,
    ).catch(async (error: unknown) => {
      // Só troca de modelo quando o problema é de disponibilidade. Uma falha de
      // schema repetiria o mesmo erro no segundo modelo e cobraria duas vezes.
      if (abortSignal.aborted || judgeFallbackModelId === judgeModelId) throw error;
      if (!isAvailabilityError(error)) throw error;

      activeModelId = judgeFallbackModelId;
      console.warn("AI judge fallback", {
        sessionId: session.id,
        unavailableModel: judgeModelId,
        fallbackModel: activeModelId,
      });
      return generateEvaluation(activeModelId, instructions, prompt, abortSignal, 1);
    });

    const evaluation = normalizeEvaluation(result.output);
    completeDebate(session, evaluation, new Date().toISOString());

    logAiUsage({
      operation: "evaluation",
      sessionId: session.id,
      model: activeModelId,
      fallbackFrom: activeModelId === judgeModelId ? null : judgeModelId,
      usage: result.usage,
      durationMs: performance.now() - startedAt,
      finishReason: result.finishReason,
    });

    return Response.json(
      {
        evaluation,
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        },
        model: activeModelId,
        fallbackFrom: activeModelId === judgeModelId ? null : judgeModelId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return requestErrorResponse(error);
  } finally {
    releaseGuard?.();
  }
}

function generateEvaluation(
  modelId: string,
  instructions: string,
  prompt: string,
  abortSignal: AbortSignal,
  maxRetries: number,
) {
  return generateText({
    model: google(modelId),
    instructions,
    prompt,
    output: Output.object({
      name: "DebateEvaluation",
      description: "Avaliação estruturada e baseada na transcrição do debate.",
      schema: judgeOutputSchema,
    }),
    temperature: 0.35,
    maxOutputTokens: 1_800,
    abortSignal,
    maxRetries,
    providerOptions:
      modelId === judgeModelId ? judgeProviderOptions : judgeFallbackProviderOptions,
  });
}
