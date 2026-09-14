import type { Character, CharacterId, Judge, JudgeId, Theme, ThemeId } from "./types";

/** Retrato usado no canal do participante. */
export const PLAYER_PORTRAIT = "/cast/player.jpg";

/** Identificador do tema quando a pessoa escreve a própria tese. */
export const CUSTOM_THEME_ID = "custom" as const;
export const CUSTOM_THESIS_MIN = 10;
export const CUSTOM_THESIS_MAX = 160;

export const characters: readonly Character[] = [
  {
    id: "nietzsche",
    portrait: "/cast/nietzsche.jpg",
    name: "Friedrich Nietzsche",
    lifespan: "1844–1900",
    summary: "Crítico da moral tradicional e investigador da criação de valores.",
    coreIdeas: ["crítica da moral", "vontade de poder", "eterno retorno", "além-do-homem"],
    bibliography: ["Além do bem e do mal", "Genealogia da moral", "A gaia ciência"],
  },
  {
    id: "kant",
    portrait: "/cast/kant.jpg",
    name: "Immanuel Kant",
    lifespan: "1724–1804",
    summary: "Filósofo da autonomia, do dever moral e dos limites da razão.",
    coreIdeas: ["imperativo categórico", "autonomia", "dever", "limites do conhecimento"],
    bibliography: ["Crítica da razão pura", "Fundamentação da metafísica dos costumes"],
  },
  {
    id: "freud",
    portrait: "/cast/freud.jpg",
    name: "Sigmund Freud",
    lifespan: "1856–1939",
    summary: "Criador da psicanálise e teórico dos conflitos do inconsciente.",
    coreIdeas: ["inconsciente", "repressão", "pulsões", "conflito psíquico"],
    bibliography: ["A interpretação dos sonhos", "O mal-estar na civilização"],
  },
  {
    id: "jung",
    portrait: "/cast/jung.jpg",
    name: "Carl Gustav Jung",
    lifespan: "1875–1961",
    summary: "Psiquiatra que investigou arquétipos, símbolos e individuação.",
    coreIdeas: ["arquétipos", "inconsciente coletivo", "sombra", "individuação"],
    bibliography: ["Tipos psicológicos", "O homem e seus símbolos"],
  },
] as const;

export const judges: readonly Judge[] = [
  {
    id: "socrates",
    portrait: "/cast/socrates.jpg",
    name: "Sócrates",
    summary: "Questiona definições, premissas ocultas e contradições.",
    priorities: ["clarity", "logic", "engagement"],
  },
  {
    id: "aristotle",
    portrait: "/cast/aristotle.jpg",
    name: "Aristóteles",
    summary: "Prioriza estrutura lógica, evidências e força persuasiva.",
    priorities: ["logic", "examples", "persuasion"],
  },
  {
    id: "hannah-arendt",
    portrait: "/cast/hannah-arendt.jpg",
    name: "Hannah Arendt",
    summary: "Valoriza nuance, responsabilidade e consequências públicas.",
    priorities: ["engagement", "clarity", "examples"],
  },
] as const;

export const themes: readonly Theme[] = [
  { id: "free-will", title: "Livre-arbítrio", thesis: "Existe livre-arbítrio?" },
  {
    id: "morality-and-religion",
    title: "Moralidade e religião",
    thesis: "A moralidade depende da religião?",
  },
  {
    id: "meaning-of-suffering",
    title: "Sentido do sofrimento",
    thesis: "O sofrimento dá sentido à vida?",
  },
  { id: "objective-truth", title: "Verdade", thesis: "A verdade é objetiva?" },
  {
    id: "technology-and-freedom",
    title: "Tecnologia e liberdade",
    thesis: "A tecnologia nos torna mais livres?",
  },
  {
    id: "always-tell-truth",
    title: "Verdade e dever",
    thesis: "Devemos sempre dizer a verdade?",
  },
  {
    id: "unconscious-decisions",
    title: "Decisão e inconsciente",
    thesis: "O inconsciente controla nossas decisões?",
  },
  {
    id: "happiness-as-goal",
    title: "Felicidade",
    thesis: "A felicidade deve ser o objetivo da vida?",
  },
] as const;

export function findCharacter(id: CharacterId): Character | undefined {
  return characters.find((character) => character.id === id);
}

export function findJudge(id: JudgeId): Judge | undefined {
  return judges.find((judge) => judge.id === id);
}

export function findTheme(id: ThemeId): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}

/**
 * A tese em pauta: a do catálogo ou a escrita pela pessoa. Retorna string vazia
 * quando a combinação é inválida, para quem só precisa exibir.
 */
export function resolveThesis(
  source: { themeId: ThemeId; customThesis?: string },
): string {
  if (source.themeId === CUSTOM_THEME_ID) return source.customThesis?.trim() ?? "";
  return findTheme(source.themeId)?.thesis ?? "";
}

/** Rótulo curto da pauta, usado em resumos. */
export function resolveThemeTitle(
  source: { themeId: ThemeId; customThesis?: string },
): string {
  if (source.themeId === CUSTOM_THEME_ID) return "Tese própria";
  return findTheme(source.themeId)?.title ?? "";
}
