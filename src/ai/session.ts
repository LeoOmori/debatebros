import {
  appendTurn,
  createDebateSession,
  DebateDomainError,
  resolveThesis,
  type DebateSession,
} from "@/domain";
import { aiSessionSchema } from "./schemas";

export function rebuildValidatedSession(input: unknown): DebateSession {
  const parsed = aiSessionSchema.parse(input);
  const thesis = resolveThesis(parsed);
  const side = parsed.userPosition.startsWith("A favor:")
    ? "A favor"
    : parsed.userPosition.startsWith("Contra:")
      ? "Contra"
      : null;
  if (!thesis || !side) {
    throw new DebateDomainError(
      "EMPTY_POSITION",
      "A posição deve corresponder a um dos lados da tese selecionada.",
    );
  }
  let session = createDebateSession({
    id: parsed.id,
    characterId: parsed.characterId,
    judgeId: parsed.judgeId,
    themeId: parsed.themeId,
    customThesis: parsed.customThesis,
    userPosition: `${side}: ${thesis}`,
    createdAt: parsed.createdAt,
  });

  for (const turn of parsed.turns) {
    if (turn.stage !== session.stage) {
      throw new DebateDomainError(
        "INVALID_STAGE",
        "A transcrição não corresponde à sequência esperada.",
      );
    }
    session = appendTurn(session, {
      id: turn.id,
      speaker: turn.speaker,
      content: turn.content,
      createdAt: turn.createdAt,
    });
  }

  if (session.stage !== parsed.stage) {
    throw new DebateDomainError(
      "INVALID_STAGE",
      "A etapa informada não corresponde à transcrição.",
    );
  }

  return session;
}
