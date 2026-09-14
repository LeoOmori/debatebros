import { afterEach, describe, expect, it, vi } from "vitest";
import { appendTurn, createDebateSession, type DebateSession } from "@/domain";
import { generateMockCharacterTurn, generateMockEvaluation } from "./mock-debate";

afterEach(() => {
  vi.useRealTimers();
});

function baseSession(): DebateSession {
  return createDebateSession({
    id: "mock-session",
    characterId: "kant",
    judgeId: "aristotle",
    themeId: "always-tell-truth",
    userPosition: "Contra: devemos sempre dizer a verdade?",
    createdAt: "2026-09-13T12:00:00.000Z",
  });
}

async function resolveDelayed<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  await vi.advanceTimersByTimeAsync(milliseconds);
  return promise;
}

describe("simulated debate responses", () => {
  it("returns a stage-specific character response", async () => {
    vi.useFakeTimers();
    const response = await resolveDelayed(generateMockCharacterTurn(baseSession()), 850);

    expect(response).toContain("Liberdade é autonomia");
  });

  it("rejects character generation during a user stage", async () => {
    vi.useFakeTimers();
    const session = appendTurn(baseSession(), {
      id: "opening",
      speaker: "character",
      content: "Abertura",
      createdAt: "2026-09-13T12:01:00.000Z",
    });
    const result = generateMockCharacterTurn(session);
    const rejection = expect(result).rejects.toThrow(/não pode falar/);
    await vi.advanceTimersByTimeAsync(850);
    await rejection;
  });

  it("produces a complete bounded evaluation from the transcript", async () => {
    vi.useFakeTimers();
    let session = baseSession();
    const speakers = ["character", "user", "character", "user", "character", "user"] as const;
    speakers.forEach((speaker, index) => {
      session = appendTurn(session, {
        id: `turn-${index}`,
        speaker,
        content: `${speaker} apresenta um argumento suficientemente desenvolvido para o teste.`,
        createdAt: `2026-09-13T12:0${index}:00.000Z`,
      });
    });

    const evaluation = await resolveDelayed(generateMockEvaluation(session), 1100);
    expect(Object.keys(evaluation.scores)).toHaveLength(5);
    expect(evaluation.scores.clarity.evidence).toContain("argumento suficientemente desenvolvido");
    expect(evaluation.strengths.length).toBeGreaterThan(0);
    expect(evaluation.improvedArgument).toContain("Devemos sempre dizer a verdade?");
  });
});
