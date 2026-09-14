import {
  CUSTOM_THEME_ID,
  CUSTOM_THESIS_MAX,
  CUSTOM_THESIS_MIN,
  findCharacter,
  findJudge,
  findTheme,
} from "./catalogs";
import type {
  AppendTurnInput,
  CreateDebateSessionInput,
  DebateEvaluation,
  DebateSession,
  DebateSpeaker,
  DebateStage,
  ScoreDimension,
} from "./types";

export type DebateErrorCode =
  | "UNKNOWN_CHARACTER"
  | "UNKNOWN_JUDGE"
  | "UNKNOWN_THEME"
  | "INVALID_THESIS"
  | "EMPTY_POSITION"
  | "EMPTY_TURN"
  | "INVALID_STAGE"
  | "WRONG_SPEAKER"
  | "DUPLICATE_TURN"
  | "INVALID_EVALUATION";

export class DebateDomainError extends Error {
  constructor(
    public readonly code: DebateErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DebateDomainError";
  }
}

export const DEBATE_STAGE_SEQUENCE = [
  "character_opening",
  "user_opening",
  "character_rebuttal",
  "user_rebuttal",
  "character_counter_rebuttal",
  "user_conclusion",
] as const satisfies readonly DebateStage[];

const nextStage: Readonly<Record<Exclude<DebateStage, "completed">, DebateStage>> = {
  character_opening: "user_opening",
  user_opening: "character_rebuttal",
  character_rebuttal: "user_rebuttal",
  user_rebuttal: "character_counter_rebuttal",
  character_counter_rebuttal: "user_conclusion",
  user_conclusion: "judging",
  judging: "completed",
};

const stageSpeaker: Readonly<
  Record<Exclude<DebateStage, "judging" | "completed">, DebateSpeaker>
> = {
  character_opening: "character",
  user_opening: "user",
  character_rebuttal: "character",
  user_rebuttal: "user",
  character_counter_rebuttal: "character",
  user_conclusion: "user",
};

const scoreDimensions: readonly ScoreDimension[] = [
  "clarity",
  "logic",
  "engagement",
  "examples",
  "persuasion",
];

export function createDebateSession(input: CreateDebateSessionInput): DebateSession {
  if (!findCharacter(input.characterId)) {
    throw new DebateDomainError("UNKNOWN_CHARACTER", "Personagem desconhecido.");
  }
  if (!findJudge(input.judgeId)) {
    throw new DebateDomainError("UNKNOWN_JUDGE", "Juiz desconhecido.");
  }
  if (input.themeId === CUSTOM_THEME_ID) {
    const thesis = input.customThesis?.trim() ?? "";
    if (thesis.length < CUSTOM_THESIS_MIN || thesis.length > CUSTOM_THESIS_MAX) {
      throw new DebateDomainError(
        "INVALID_THESIS",
        `A tese própria deve ter entre ${CUSTOM_THESIS_MIN} e ${CUSTOM_THESIS_MAX} caracteres.`,
      );
    }
  } else if (!findTheme(input.themeId)) {
    throw new DebateDomainError("UNKNOWN_THEME", "Tema desconhecido.");
  }
  if (!input.userPosition.trim()) {
    throw new DebateDomainError("EMPTY_POSITION", "A posição da pessoa é obrigatória.");
  }

  return {
    ...input,
    customThesis: input.themeId === CUSTOM_THEME_ID ? input.customThesis?.trim() : undefined,
    userPosition: input.userPosition.trim(),
    stage: "character_opening",
    turns: [],
    evaluation: null,
    updatedAt: input.createdAt,
  };
}

export function expectedSpeaker(stage: DebateStage): DebateSpeaker | null {
  if (stage === "judging" || stage === "completed") {
    return null;
  }
  return stageSpeaker[stage];
}

export function getNextStage(stage: DebateStage): DebateStage | null {
  return stage === "completed" ? null : nextStage[stage];
}

export function appendTurn(session: DebateSession, input: AppendTurnInput): DebateSession {
  const speaker = expectedSpeaker(session.stage);
  if (!speaker) {
    throw new DebateDomainError("INVALID_STAGE", "Esta etapa não aceita novas falas.");
  }
  if (input.speaker !== speaker) {
    throw new DebateDomainError("WRONG_SPEAKER", `A fala esperada é de ${speaker}.`);
  }
  if (!input.content.trim()) {
    throw new DebateDomainError("EMPTY_TURN", "A fala não pode estar vazia.");
  }
  if (session.turns.some((turn) => turn.id === input.id)) {
    throw new DebateDomainError("DUPLICATE_TURN", "Esta fala já foi registrada.");
  }

  const stage = session.stage as Exclude<DebateStage, "judging" | "completed">;
  return {
    ...session,
    stage: nextStage[stage],
    turns: [
      ...session.turns,
      {
        ...input,
        content: input.content.trim(),
        stage,
      },
    ],
    updatedAt: input.createdAt,
  };
}

export function completeDebate(
  session: DebateSession,
  evaluation: DebateEvaluation,
  completedAt: string,
): DebateSession {
  if (session.stage !== "judging") {
    throw new DebateDomainError(
      "INVALID_STAGE",
      "O debate só pode ser concluído durante a avaliação.",
    );
  }
  validateEvaluation(evaluation, session);
  return {
    ...session,
    stage: "completed",
    evaluation,
    updatedAt: completedAt,
  };
}

function validateEvaluation(
  evaluation: DebateEvaluation,
  session: DebateSession,
): void {
  const userTurnContent = session.turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => turn.content);
  const hasInvalidScore = scoreDimensions.some((dimension) => {
    const result = evaluation.scores[dimension];
    return (
      !result ||
      !Number.isFinite(result.score) ||
      result.score < 0 ||
      result.score > 10 ||
      !result.evidence?.trim() ||
      !userTurnContent.some((content) => content.includes(result.evidence.trim())) ||
      !result.justification.trim()
    );
  });
  const hasInvalidText = [
    evaluation.summary,
    evaluation.missedObjection,
    evaluation.improvedArgument,
    evaluation.nextTopic,
  ].some((value) => !value?.trim());
  const hasInvalidList = [evaluation.strengths, evaluation.weaknesses].some(
    (items) => !Array.isArray(items) || items.length === 0 || items.some((item) => !item.trim()),
  );
  const hasInvalidVerdict = !["user", "character", "draw"].includes(evaluation.verdict);

  if (hasInvalidScore || hasInvalidText || hasInvalidList || hasInvalidVerdict) {
    throw new DebateDomainError("INVALID_EVALUATION", "A avaliação está incompleta ou inválida.");
  }
}
