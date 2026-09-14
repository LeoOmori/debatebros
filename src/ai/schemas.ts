import { z } from "zod";

export const characterIdSchema = z.enum(["nietzsche", "kant", "freud", "jung"]);
export const judgeIdSchema = z.enum(["socrates", "aristotle", "hannah-arendt"]);
export const themeIdSchema = z.enum([
  "custom",
  "free-will",
  "morality-and-religion",
  "meaning-of-suffering",
  "objective-truth",
  "technology-and-freedom",
  "always-tell-truth",
  "unconscious-decisions",
  "happiness-as-goal",
]);
export const spokenStageSchema = z.enum([
  "character_opening",
  "user_opening",
  "character_rebuttal",
  "user_rebuttal",
  "character_counter_rebuttal",
  "user_conclusion",
]);
export const debateStageSchema = z.enum([
  ...spokenStageSchema.options,
  "judging",
  "completed",
]);
export const opaqueIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);

export const debateTurnSchema = z.object({
  id: opaqueIdSchema,
  stage: spokenStageSchema,
  speaker: z.enum(["character", "user"]),
  content: z.string().trim().min(1).max(1_200),
  createdAt: z.iso.datetime({ offset: true }),
}).superRefine((turn, context) => {
  if (turn.speaker === "user" && turn.content.length > 900) {
    context.addIssue({
      code: "too_big",
      maximum: 900,
      origin: "string",
      inclusive: true,
      path: ["content"],
      message: "A fala da pessoa excede 900 caracteres.",
    });
  }
});

export const aiSessionSchema = z.object({
  id: opaqueIdSchema,
  characterId: characterIdSchema,
  judgeId: judgeIdSchema,
  themeId: themeIdSchema,
  customThesis: z.string().trim().min(10).max(160).optional(),
  userPosition: z.string().trim().min(1).max(400),
  stage: debateStageSchema,
  turns: z.array(debateTurnSchema).max(6),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}).superRefine((session, context) => {
  if (session.themeId === "custom" && !session.customThesis) {
    context.addIssue({
      code: "custom",
      path: ["customThesis"],
      message: "A tese própria é obrigatória quando o tema é custom.",
    });
  }
  if (session.themeId !== "custom" && session.customThesis) {
    context.addIssue({
      code: "custom",
      path: ["customThesis"],
      message: "A tese própria só acompanha o tema custom.",
    });
  }
  const transcriptLength = session.turns.reduce((total, turn) => total + turn.content.length, 0);
  if (transcriptLength > 6_300) {
    context.addIssue({
      code: "too_big",
      maximum: 6_300,
      origin: "array",
      inclusive: true,
      path: ["turns"],
      message: "A transcrição excede o limite permitido.",
    });
  }
});

export const characterTurnRequestSchema = z.object({
  session: aiSessionSchema,
});

export const evaluationRequestSchema = z.object({
  session: aiSessionSchema,
});

/*
 * Limites curtos de propósito: o relatório é para ser lido de uma vez, não
 * estudado. Texto menor também significa menos tokens de saída por avaliação.
 */
export const evaluationLimits = {
  summary: 240,
  evidence: 200,
  justification: 150,
  listItem: 110,
  missedObjection: 180,
  improvedArgument: 420,
  nextTopic: 120,
} as const;

/** Folga dada ao modelo antes de recortarmos o texto para o limite final. */
const OUTPUT_SLACK = 2;

const evidenceDescription =
  "Trecho literal curto de uma fala da pessoa, copiado sem aspas e sem alterar palavras.";

function scoreResult(maxEvidence: number, maxJustification: number) {
  return z.object({
    score: z.number().int().min(0).max(10),
    evidence: z.string().trim().min(5).max(maxEvidence).describe(evidenceDescription),
    justification: z.string().trim().min(20).max(maxJustification),
  });
}

function evaluationShape(slack: number) {
  const limit = (value: number) => value * slack;
  const listItem = z.string().trim().min(10).max(limit(evaluationLimits.listItem));

  return z.object({
    verdict: z.enum(["user", "character", "draw"]),
    summary: z.string().trim().min(40).max(limit(evaluationLimits.summary)),
    scores: z.object({
      clarity: scoreResult(limit(evaluationLimits.evidence), limit(evaluationLimits.justification)),
      logic: scoreResult(limit(evaluationLimits.evidence), limit(evaluationLimits.justification)),
      engagement: scoreResult(limit(evaluationLimits.evidence), limit(evaluationLimits.justification)),
      examples: scoreResult(limit(evaluationLimits.evidence), limit(evaluationLimits.justification)),
      persuasion: scoreResult(limit(evaluationLimits.evidence), limit(evaluationLimits.justification)),
    }),
    strengths: z.array(listItem).min(2).max(slack === 1 ? 3 : 5),
    weaknesses: z.array(listItem).min(2).max(slack === 1 ? 3 : 5),
    missedObjection: z.string().trim().min(20).max(limit(evaluationLimits.missedObjection)),
    possibleFallacies: z.array(listItem).max(slack === 1 ? 3 : 5),
    improvedArgument: z.string().trim().min(60).max(limit(evaluationLimits.improvedArgument)),
    nextTopic: z.string().trim().min(5).max(limit(evaluationLimits.nextTopic)),
  });
}

/** Contrato final persistido e exibido na interface. */
export const debateEvaluationSchema = evaluationShape(1);

/**
 * Contrato pedido ao modelo. Aceita textos mais longos que o limite final para
 * que um estouro de poucos caracteres não invalide um relatório íntegro; o
 * recorte para o limite real acontece em `normalizeEvaluation`.
 */
export const judgeOutputSchema = evaluationShape(OUTPUT_SLACK);

export type JudgeOutput = z.infer<typeof judgeOutputSchema>;

/**
 * Corta no último limite de palavra dentro de `max`. `evidence` não recebe
 * reticências porque precisa continuar sendo um trecho literal da transcrição.
 */
function clampText(value: string, max: number, ellipsis = true): string {
  const text = value.trim();
  if (text.length <= max) return text;

  const budget = ellipsis ? max - 1 : max;
  const head = text.slice(0, budget);
  const lastSpace = head.lastIndexOf(" ");
  const cut = (lastSpace > budget * 0.6 ? head.slice(0, lastSpace) : head).trimEnd();
  return ellipsis ? `${cut}…` : cut;
}

function clampScore(result: JudgeOutput["scores"]["clarity"]) {
  return {
    score: result.score,
    evidence: clampText(result.evidence, evaluationLimits.evidence, false),
    justification: clampText(result.justification, evaluationLimits.justification),
  };
}

function clampList(items: string[], max: number): string[] {
  return items.slice(0, max).map((item) => clampText(item, evaluationLimits.listItem));
}

/** Ajusta o relatório do modelo aos limites finais antes da validação estrita. */
export function normalizeEvaluation(output: JudgeOutput) {
  return debateEvaluationSchema.parse({
    verdict: output.verdict,
    summary: clampText(output.summary, evaluationLimits.summary),
    scores: {
      clarity: clampScore(output.scores.clarity),
      logic: clampScore(output.scores.logic),
      engagement: clampScore(output.scores.engagement),
      examples: clampScore(output.scores.examples),
      persuasion: clampScore(output.scores.persuasion),
    },
    strengths: clampList(output.strengths, 3),
    weaknesses: clampList(output.weaknesses, 3),
    missedObjection: clampText(output.missedObjection, evaluationLimits.missedObjection),
    possibleFallacies: clampList(output.possibleFallacies, 3),
    improvedArgument: clampText(output.improvedArgument, evaluationLimits.improvedArgument),
    nextTopic: clampText(output.nextTopic, evaluationLimits.nextTopic),
  });
}

export type AiSessionInput = z.infer<typeof aiSessionSchema>;
