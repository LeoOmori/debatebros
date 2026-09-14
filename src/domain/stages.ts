import type { DebateStage, ScoreDimension } from "./types";

export const scoreDimensionLabels: Readonly<Record<ScoreDimension, string>> = {
  clarity: "Clareza",
  logic: "Lógica",
  engagement: "Resposta",
  examples: "Exemplos",
  persuasion: "Persuasão",
};

export interface StageCopy {
  shortLabel: string;
  title: string;
  instruction: string;
}

export const stageCopy: Readonly<Record<DebateStage, StageCopy>> = {
  character_opening: {
    shortLabel: "Abertura",
    title: "O oponente abre o debate",
    instruction: "Escute a posição inicial antes de preparar sua defesa.",
  },
  user_opening: {
    shortLabel: "Seu argumento",
    title: "Apresente sua tese",
    instruction: "Defina sua posição e ofereça uma razão central para sustentá-la.",
  },
  character_rebuttal: {
    shortLabel: "Réplica",
    title: "O oponente responde",
    instruction: "Observe qual premissa da sua defesa está sendo contestada.",
  },
  user_rebuttal: {
    shortLabel: "Sua réplica",
    title: "Responda à objeção",
    instruction: "Enfrente o ponto levantado sem apenas repetir seu argumento inicial.",
  },
  character_counter_rebuttal: {
    shortLabel: "Tréplica",
    title: "A objeção final",
    instruction: "Identifique o conflito principal antes da sua conclusão.",
  },
  user_conclusion: {
    shortLabel: "Conclusão",
    title: "Feche sua defesa",
    instruction: "Resuma sua posição e responda ao ponto mais forte do oponente.",
  },
  judging: {
    shortLabel: "Julgamento",
    title: "O juiz está deliberando",
    instruction: "A transcrição completa está sendo analisada.",
  },
  completed: {
    shortLabel: "Resultado",
    title: "O veredito está pronto",
    instruction: "Leia as evidências e descubra como fortalecer sua próxima defesa.",
  },
};
