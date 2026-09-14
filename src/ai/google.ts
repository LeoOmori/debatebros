import { createGoogle, type GoogleLanguageModelOptions } from "@ai-sdk/google";

export const google = createGoogle({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/*
 * Padrão econômico: o modelo mais barato disponível na conta em todos os papéis.
 * gemini-2.5-flash-lite foi descontinuado para contas novas; 3.1-flash-lite é o
 * degrau mais barato que ainda aceita saída estruturada.
 */
export const debateModelId = process.env.GEMINI_DEBATE_MODEL ?? "gemini-3.1-flash-lite";
export const judgeModelId = process.env.GEMINI_JUDGE_MODEL ?? "gemini-3.1-flash-lite";
/*
 * O fallback precisa ser um modelo DIFERENTE: ele existe para o caso de o
 * primeiro estar fora do ar, e só é chamado nesse caso — no caminho feliz não
 * custa nada.
 */
export const judgeFallbackModelId =
  process.env.GEMINI_JUDGE_FALLBACK_MODEL ?? "gemini-3.8-flash";

/*
 * Tokens de raciocínio são cobrados como saída: num teste trivial, thinkingLevel
 * "low" custou 117 tokens de pensamento contra 0 com orçamento zero. Suba o
 * GEMINI_THINKING_BUDGET quando quiser qualidade em vez de economia.
 */
const thinkingBudget = Number.isSafeInteger(Number(process.env.GEMINI_THINKING_BUDGET))
  ? Math.max(0, Number(process.env.GEMINI_THINKING_BUDGET))
  : 0;

const economyOptions = {
  google: { thinkingConfig: { thinkingBudget } } satisfies GoogleLanguageModelOptions,
};

export const debateProviderOptions = economyOptions;
export const judgeProviderOptions = economyOptions;
export const judgeFallbackProviderOptions = economyOptions;
