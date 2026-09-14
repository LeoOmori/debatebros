import { describe, expect, it } from "vitest";
import {
  appendTurn,
  completeDebate,
  createDebateSession,
  DebateDomainError,
  expectedSpeaker,
  getNextStage,
} from "./debate-machine";
import type {
  CreateDebateSessionInput,
  DebateEvaluation,
  DebateSession,
  DebateSpeaker,
} from "./types";

const createdAt = "2026-09-13T10:00:00.000Z";

const sessionInput: CreateDebateSessionInput = {
  id: "debate-1",
  characterId: "nietzsche",
  judgeId: "socrates",
  themeId: "free-will",
  userPosition: "O livre-arbítrio existe.",
  createdAt,
};

const evaluation: DebateEvaluation = {
  verdict: "draw",
  summary: "As duas posições foram defendidas com clareza.",
  scores: {
    clarity: { score: 8, evidence: "Argumento 2", justification: "A tese foi apresentada diretamente." },
    logic: { score: 7, evidence: "Argumento 6", justification: "A conclusão acompanhou as premissas." },
    engagement: { score: 8, evidence: "Argumento 4", justification: "As objeções centrais foram respondidas." },
    examples: { score: 6, evidence: "Argumento 2", justification: "Houve um exemplo relevante." },
    persuasion: { score: 7, evidence: "Argumento 6", justification: "A defesa permaneceu consistente." },
  },
  strengths: ["Tese clara"],
  weaknesses: ["Poucos exemplos"],
  missedObjection: "A origem causal das escolhas.",
  possibleFallacies: [],
  improvedArgument: "Mesmo sob influências, deliberar pode constituir liberdade prática.",
  nextTopic: "Compatibilismo",
};

function createSession(): DebateSession {
  return createDebateSession(sessionInput);
}

function add(session: DebateSession, speaker: DebateSpeaker, index: number): DebateSession {
  return appendTurn(session, {
    id: `turn-${index}`,
    speaker,
    content: `Argumento ${index}`,
    createdAt: `2026-09-13T10:0${index}:00.000Z`,
  });
}

describe("debate state machine", () => {
  it("follows the complete debate sequence", () => {
    let session = createSession();
    const sequence: readonly DebateSpeaker[] = [
      "character",
      "user",
      "character",
      "user",
      "character",
      "user",
    ];

    sequence.forEach((speaker, index) => {
      expect(expectedSpeaker(session.stage)).toBe(speaker);
      session = add(session, speaker, index + 1);
    });

    expect(session.stage).toBe("judging");
    expect(session.turns).toHaveLength(6);

    const completed = completeDebate(session, evaluation, "2026-09-13T10:10:00.000Z");
    expect(completed.stage).toBe("completed");
    expect(completed.evaluation).toEqual(evaluation);
    expect(expectedSpeaker(completed.stage)).toBeNull();
    expect(getNextStage(completed.stage)).toBeNull();
  });

  it("rejects a turn from the wrong speaker without mutating the session", () => {
    const session = createSession();

    expect(() => add(session, "user", 1)).toThrowError(DebateDomainError);
    expect(session.stage).toBe("character_opening");
    expect(session.turns).toEqual([]);
  });

  it("prevents skipped and duplicate turns", () => {
    const initial = createSession();
    const afterOpening = add(initial, "character", 1);

    expect(() => add(afterOpening, "character", 2)).toThrowError(/user/);
    expect(() =>
      appendTurn(afterOpening, {
        id: "turn-1",
        speaker: "user",
        content: "Resposta",
        createdAt,
      }),
    ).toThrowError(/já foi registrada/);
    expect(afterOpening.turns).toHaveLength(1);
  });

  it("rejects empty turns", () => {
    const session = createSession();
    expect(() =>
      appendTurn(session, {
        id: "empty",
        speaker: "character",
        content: "   ",
        createdAt,
      }),
    ).toThrowError(/vazia/);
  });

  it("rejects unknown catalog ids", () => {
    expect(() =>
      createDebateSession({
        ...sessionInput,
        characterId: "unknown" as CreateDebateSessionInput["characterId"],
      }),
    ).toThrowError(/Personagem desconhecido/);
    expect(() =>
      createDebateSession({
        ...sessionInput,
        judgeId: "unknown" as CreateDebateSessionInput["judgeId"],
      }),
    ).toThrowError(/Juiz desconhecido/);
    expect(() =>
      createDebateSession({
        ...sessionInput,
        themeId: "unknown" as CreateDebateSessionInput["themeId"],
      }),
    ).toThrowError(/Tema desconhecido/);
  });

  it("accepts a thesis written by the person and rejects one that is too short", () => {
    const custom = {
      ...sessionInput,
      themeId: "custom" as const,
      customThesis: "  O anonimato online melhora o debate público?  ",
      userPosition: "A favor: O anonimato online melhora o debate público?",
    };

    expect(createDebateSession(custom).customThesis).toBe(
      "O anonimato online melhora o debate público?",
    );
    expect(() => createDebateSession({ ...custom, customThesis: "curta" })).toThrowError(
      /tese própria/i,
    );
    expect(() => createDebateSession({ ...custom, customThesis: undefined })).toThrowError(
      /tese própria/i,
    );
    // Um tema do catálogo não carrega tese própria mesmo que ela venha no input.
    expect(
      createDebateSession({ ...sessionInput, customThesis: "texto ignorado aqui" }).customThesis,
    ).toBeUndefined();
  });

  it("only completes from judging and validates score bounds", () => {
    expect(() => completeDebate(createSession(), evaluation, createdAt)).toThrowError(
      /durante a avaliação/,
    );

    let judging = createSession();
    (["character", "user", "character", "user", "character", "user"] as const).forEach(
      (speaker, index) => {
        judging = add(judging, speaker, index + 1);
      },
    );

    const invalidEvaluation: DebateEvaluation = {
      ...evaluation,
      scores: {
        ...evaluation.scores,
        clarity: { score: 11, evidence: "Argumento 2", justification: "Inválida" },
      },
    };
    expect(() => completeDebate(judging, invalidEvaluation, createdAt)).toThrowError(
      /inválida/,
    );

    const incompleteEvaluation = {
      ...evaluation,
      scores: {
        clarity: evaluation.scores.clarity,
      },
    } as DebateEvaluation;
    expect(() => completeDebate(judging, incompleteEvaluation, createdAt)).toThrowError(
      /incompleta/,
    );

    const inventedEvidence: DebateEvaluation = {
      ...evaluation,
      scores: {
        ...evaluation.scores,
        clarity: {
          ...evaluation.scores.clarity,
          evidence: "Trecho que não existe na transcrição",
        },
      },
    };
    expect(() => completeDebate(judging, inventedEvidence, createdAt)).toThrowError(
      /inválida/,
    );
  });
});
