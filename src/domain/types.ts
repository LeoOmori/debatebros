export type CharacterId = "nietzsche" | "kant" | "freud" | "jung";

export type JudgeId = "socrates" | "aristotle" | "hannah-arendt";

export type ThemeId =
  | "custom"
  | "free-will"
  | "morality-and-religion"
  | "meaning-of-suffering"
  | "objective-truth"
  | "technology-and-freedom"
  | "always-tell-truth"
  | "unconscious-decisions"
  | "happiness-as-goal";

export interface Character {
  id: CharacterId;
  name: string;
  /** Retrato da colagem servido de /public/cast. */
  portrait: string;
  lifespan: string;
  summary: string;
  coreIdeas: readonly string[];
  bibliography: readonly string[];
}

export type ScoreDimension =
  | "clarity"
  | "logic"
  | "engagement"
  | "examples"
  | "persuasion";

export interface Judge {
  id: JudgeId;
  name: string;
  /** Retrato da colagem servido de /public/cast. */
  portrait: string;
  summary: string;
  priorities: readonly ScoreDimension[];
}

export interface Theme {
  id: ThemeId;
  title: string;
  thesis: string;
}

export type DebateStage =
  | "character_opening"
  | "user_opening"
  | "character_rebuttal"
  | "user_rebuttal"
  | "character_counter_rebuttal"
  | "user_conclusion"
  | "judging"
  | "completed";

export type DebateSpeaker = "character" | "user";

export interface DebateTurn {
  id: string;
  stage: Exclude<DebateStage, "judging" | "completed">;
  speaker: DebateSpeaker;
  content: string;
  createdAt: string;
}

export interface ScoreResult {
  score: number;
  evidence: string;
  justification: string;
}

export interface DebateEvaluation {
  verdict: "user" | "character" | "draw";
  summary: string;
  scores: Record<ScoreDimension, ScoreResult>;
  strengths: readonly string[];
  weaknesses: readonly string[];
  missedObjection: string;
  possibleFallacies: readonly string[];
  improvedArgument: string;
  nextTopic: string;
}

export interface DebateSession {
  id: string;
  characterId: CharacterId;
  judgeId: JudgeId;
  themeId: ThemeId;
  /** Tese escrita pela pessoa. Presente apenas quando themeId é "custom". */
  customThesis?: string;
  userPosition: string;
  stage: DebateStage;
  turns: readonly DebateTurn[];
  evaluation: DebateEvaluation | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebateSessionInput {
  id: string;
  characterId: CharacterId;
  judgeId: JudgeId;
  themeId: ThemeId;
  customThesis?: string;
  userPosition: string;
  createdAt: string;
}

export interface AppendTurnInput {
  id: string;
  speaker: DebateSpeaker;
  content: string;
  createdAt: string;
}
