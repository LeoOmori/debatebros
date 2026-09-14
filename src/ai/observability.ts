interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

interface UsageLogInput {
  operation: "debate-turn" | "evaluation";
  sessionId: string;
  model: string;
  usage: TokenUsage;
  finishReason: string;
  durationMs: number;
  fallbackFrom?: string | null;
}

const pricingUsdPerMillion: Readonly<Record<string, { input: number; output: number }>> = {
  "gemini-3.8-flash": { input: 0.75, output: 3.75 },
  "gemini-3.1-pro-preview": { input: 2, output: 12 },
};

export function estimateCostUsd(model: string, usage: TokenUsage): number | null {
  const pricing = pricingUsdPerMillion[model];
  if (!pricing || usage.inputTokens === undefined || usage.outputTokens === undefined) {
    return null;
  }
  return Number(
    ((usage.inputTokens * pricing.input + usage.outputTokens * pricing.output) / 1_000_000).toFixed(6),
  );
}

export function logAiUsage(input: UsageLogInput): void {
  console.info("AI usage", {
    operation: input.operation,
    sessionId: input.sessionId,
    model: input.model,
    fallbackFrom: input.fallbackFrom ?? null,
    inputTokens: input.usage.inputTokens,
    outputTokens: input.usage.outputTokens,
    totalTokens: input.usage.totalTokens,
    estimatedCostUsd: estimateCostUsd(input.model, input.usage),
    durationMs: Math.round(input.durationMs),
    finishReason: input.finishReason,
  });
}
