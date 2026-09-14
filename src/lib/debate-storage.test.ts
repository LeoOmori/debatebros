import { describe, expect, it } from "vitest";
import { createDebateSession } from "@/domain";
import { parseStoredSession } from "./debate-storage";

const validSession = createDebateSession({
  id: "stored-session",
  characterId: "jung",
  judgeId: "hannah-arendt",
  themeId: "unconscious-decisions",
  userPosition: "Contra: O inconsciente controla nossas decisões?",
  createdAt: "2026-09-13T14:00:00.000Z",
});

describe("stored debate sessions", () => {
  it("restores a valid session", () => {
    expect(parseStoredSession(JSON.stringify(validSession))).toEqual(validSession);
  });

  it("rejects corrupt JSON and unknown domain ids", () => {
    expect(parseStoredSession("not-json")).toBeNull();
    expect(
      parseStoredSession(JSON.stringify({ ...validSession, characterId: "unknown" })),
    ).toBeNull();
  });

  it("rejects unknown stages and incomplete completed sessions", () => {
    expect(parseStoredSession(JSON.stringify({ ...validSession, stage: "skipped" }))).toBeNull();
    expect(
      parseStoredSession(JSON.stringify({ ...validSession, stage: "completed", evaluation: null })),
    ).toBeNull();
  });
});
