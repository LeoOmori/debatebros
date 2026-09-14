import type { DebateEvaluation, DebateSession } from "@/domain";

export class AiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AiClientError";
  }
}

const IN_FLIGHT_WAITS_MS = [3_000, 6_000];

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

export async function streamCharacterTurn(
  session: DebateSession,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
    signal,
  });

  if (!response.ok) throw await responseError(response);
  if (!response.body) {
    throw new AiClientError("O servidor não iniciou a transmissão.", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onText(text);
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AiClientError(
      "A transmissão foi interrompida antes do fim. Tente novamente.",
      502,
    );
  }
  text += decoder.decode();

  const normalized = text.trim();
  if (!normalized) {
    throw new AiClientError(
      "O modelo encerrou a transmissão sem produzir uma resposta. Tente novamente.",
      502,
    );
  }
  onText(normalized);
  return normalized;
}

export async function requestEvaluation(
  session: DebateSession,
  signal?: AbortSignal,
): Promise<DebateEvaluation> {
  /*
   * O servidor recusa uma segunda avaliação da mesma etapa enquanto a primeira
   * roda (409 IN_FLIGHT). Isso não é erro para quem está esperando: a avaliação
   * pedida ainda está a caminho, então esperamos em silêncio em vez de mostrar
   * uma falha e convidar a pessoa a tentar de novo, o que só empilha 409.
   */
  let response = await postEvaluation(session, signal);
  for (const delay of IN_FLIGHT_WAITS_MS) {
    if (response.status !== 409) break;
    const pending = await response.clone().json().catch(() => ({}));
    if ((pending as { code?: string }).code !== "IN_FLIGHT") break;
    await wait(delay, signal);
    response = await postEvaluation(session, signal);
  }

  if (!response.ok) throw await responseError(response);
  let payload: { evaluation?: DebateEvaluation };
  try {
    payload = (await response.json()) as { evaluation?: DebateEvaluation };
  } catch {
    throw new AiClientError("O juiz devolveu uma resposta que não pôde ser lida.", 502);
  }
  if (!payload.evaluation) {
    throw new AiClientError("O juiz devolveu uma avaliação incompleta.", 502);
  }
  return payload.evaluation;
}

function postEvaluation(session: DebateSession, signal?: AbortSignal): Promise<Response> {
  return fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
    signal,
  });
}

async function responseError(response: Response): Promise<AiClientError> {
  let message = "A IA não conseguiu responder. Tente novamente.";
  let code: string | undefined;
  try {
    const payload = (await response.json()) as { error?: unknown; code?: unknown };
    if (typeof payload.error === "string") message = payload.error;
    if (typeof payload.code === "string") code = payload.code;
  } catch {
    // Keep the safe generic message when the upstream response is not JSON.
  }
  return new AiClientError(message, response.status, code);
}
