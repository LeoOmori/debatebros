import {
  completeDebate,
  type DebateSession,
} from "@/domain";
import { debateEvaluationSchema, aiSessionSchema } from "@/ai/schemas";
import { rebuildValidatedSession } from "@/ai/session";

const ACTIVE_SESSION_KEY = "debatebros:active-session:v1";
const LAST_RESULT_KEY = "debatebros:last-result:v1";

const storedSessionSchema = aiSessionSchema.safeExtend({
  evaluation: debateEvaluationSchema.nullable(),
});

export function parseStoredSession(value: string | null): DebateSession | null {
  if (!value) return null;

  try {
    const parsed = storedSessionSchema.parse(JSON.parse(value));
    if (parsed.stage === "completed") {
      if (!parsed.evaluation) return null;
      const judging = rebuildValidatedSession({ ...parsed, stage: "judging" });
      return completeDebate(judging, parsed.evaluation, parsed.updatedAt);
    }
    if (parsed.evaluation) return null;
    return rebuildValidatedSession(parsed);
  } catch {
    return null;
  }
}

export function loadActiveSession(): DebateSession | null {
  if (typeof window === "undefined") return null;
  return parseStoredSession(window.localStorage.getItem(ACTIVE_SESSION_KEY));
}

export function saveActiveSession(session: DebateSession): void {
  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function loadLastResult(): DebateSession | null {
  if (typeof window === "undefined") return null;
  return parseStoredSession(window.localStorage.getItem(LAST_RESULT_KEY));
}

export function saveLastResult(session: DebateSession): void {
  window.localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(session));
}
