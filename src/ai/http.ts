import { APICallError } from "ai";
import { ZodError } from "zod";
import { DebateDomainError } from "@/domain";
import { AiGuardError } from "./guard";

class RequestBodyTooLargeError extends Error {}

export function jsonError(
  message: string,
  status: number,
  headers?: HeadersInit,
  code?: string,
): Response {
  return Response.json(code ? { error: message, code } : { error: message }, { status, headers });
}

/** O modelo está fora do ar ou saturado: vale esperar e tentar de novo. */
export function isAvailabilityError(error: unknown): boolean {
  if (!APICallError.isInstance(error)) return false;
  return error.isRetryable || [408, 429, 500, 502, 503, 504].includes(error.statusCode ?? 0);
}

export function requestErrorResponse(error: unknown): Response {
  if (error instanceof SyntaxError || error instanceof ZodError) {
    return jsonError("Os dados enviados para o debate são inválidos.", 400);
  }
  if (error instanceof RequestBodyTooLargeError) {
    return jsonError("A solicitação excede o tamanho permitido.", 413);
  }
  if (error instanceof DebateDomainError) {
    return jsonError(error.message, 409);
  }
  if (error instanceof AiGuardError) {
    return jsonError(
      error.message,
      error.status,
      error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : undefined,
      error.status === 409 ? "IN_FLIGHT" : "RATE_LIMITED",
    );
  }
  if (isAvailabilityError(error)) {
    console.warn("AI provider unavailable", {
      status: APICallError.isInstance(error) ? error.statusCode : undefined,
    });
    return jsonError(
      "O modelo está sobrecarregado agora. Tente de novo em alguns segundos.",
      503,
      { "Retry-After": "10" },
      "UNAVAILABLE",
    );
  }
  console.error("Unexpected AI route error", error);
  return jsonError("Não foi possível iniciar a transmissão da IA.", 502);
}

export function hasGeminiConfiguration(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export function isMockAiMode(): boolean {
  return process.env.AI_MOCK_MODE === "true";
}

export async function readJsonBody(request: Request, maximumBytes = 12_000): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) throw new SyntaxError("Missing request body");

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return JSON.parse(text) as unknown;
}
