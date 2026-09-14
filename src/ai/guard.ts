export type AiOperation = "debate-turn" | "evaluation" | "metric";

interface RateBucket {
  count: number;
  resetsAt: number;
}

interface GuardState {
  buckets: Map<string, RateBucket>;
  inFlight: Set<string>;
}

const stateKey = Symbol.for("debatebros.ai-guard");
const globalState = globalThis as typeof globalThis & { [stateKey]?: GuardState };
if (!globalState[stateKey]) {
  globalState[stateKey] = { buckets: new Map(), inFlight: new Set() };
}
const state = globalState[stateKey];

export class AiGuardError extends Error {
  constructor(
    public readonly status: 409 | 429,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AiGuardError";
  }
}

export interface RequestGuard {
  release(): void;
}

export function acquireAiRequest(
  request: Request,
  operation: Exclude<AiOperation, "metric">,
  sessionKey: string,
  now = Date.now(),
): RequestGuard {
  consumeRateLimit(request, operation, now);

  const inFlightKey = `${operation}:${sessionKey}`;
  if (state.inFlight.has(inFlightKey)) {
    throw new AiGuardError(409, "Esta etapa já está sendo processada.");
  }
  state.inFlight.add(inFlightKey);

  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      state.inFlight.delete(inFlightKey);
    },
  };
}

export function checkMetricRateLimit(request: Request, now = Date.now()): void {
  consumeRateLimit(request, "metric", now);
}

function consumeRateLimit(request: Request, operation: AiOperation, now: number): void {
  const windowMs = 60_000;
  const defaultMaximum = operation === "metric" ? 30 : 12;
  const maximum = positiveInteger(
    operation === "metric" ? process.env.METRICS_RATE_LIMIT_PER_MINUTE : process.env.AI_RATE_LIMIT_PER_MINUTE,
    defaultMaximum,
  );
  const key = `${operation}:${clientAddress(request)}`;
  const current = state.buckets.get(key);

  if (!current || current.resetsAt <= now) {
    state.buckets.set(key, { count: 1, resetsAt: now + windowMs });
    pruneExpiredBuckets(now);
    return;
  }
  if (current.count >= maximum) {
    throw new AiGuardError(
      429,
      "Muitas solicitações em pouco tempo. Aguarde antes de tentar novamente.",
      Math.max(1, Math.ceil((current.resetsAt - now) / 1_000)),
    );
  }
  current.count += 1;
}

function clientAddress(request: Request): string {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "local";
  return forwarded.split(",", 1)[0]?.trim().slice(0, 64) || "unknown";
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneExpiredBuckets(now: number): void {
  if (state.buckets.size < 500) return;
  for (const [key, bucket] of state.buckets) {
    if (bucket.resetsAt <= now) state.buckets.delete(key);
  }
}

export function resetAiGuardForTests(): void {
  state.buckets.clear();
  state.inFlight.clear();
}
