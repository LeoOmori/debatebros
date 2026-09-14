import { describe, expect, it } from "vitest";
import {
  debateEvaluationSchema,
  evaluationLimits,
  judgeOutputSchema,
  normalizeEvaluation,
} from "./schemas";

const longEvidence =
  "se existe justiça e se aristoteles estiver, existe uma perfeição de justiça em um ambiente metafísica e somente pode ser deus, se a forma material de deus na terra é atravéz da religião então somente consegue ser justos e morais atravéz dela";

function score(evidence: string) {
  return {
    score: 4,
    evidence,
    justification: "A frase apresenta truncamentos e saltos conceituais que prejudicam a clareza da tese.",
  };
}

const output = {
  verdict: "character" as const,
  summary:
    "O debatedor defendeu a necessidade de um fundamento divino para a moral, mas teve dificuldade em formular premissas claras.",
  scores: {
    clarity: score(longEvidence),
    logic: score("a força motora inicial deve vir de um ser justo"),
    engagement: score("meu argumento não é isso"),
    examples: score("podemos distinguir e adorar uma coisa bela"),
    persuasion: score("é necessário uma religião para que exista moralidade"),
  },
  strengths: ["Conecta moralidade ao ideal clássico de justiça.", "Reconhece a caridade como valor central."],
  weaknesses: ["Articulação textual truncada e imprecisa.", "Não responde ao questionamento sobre responsabilidade."],
  missedObjection: "Perdeu a chance de rebater a leitura de Nietzsche sobre Aristóteles na ética das virtudes.",
  possibleFallacies: ["Petição de princípio: pressupõe a justiça metafísica que pretende provar."],
  improvedArgument:
    "A religião oferece uma comunidade de sentido e horizontes compartilhados de responsabilidade mútua, sem os quais os deveres éticos se dissolvem em arbítrio individual.",
  nextTopic: "Normas universais de justiça sem apelo à transcendência.",
};

describe("judgeOutputSchema", () => {
  it("aceita textos acima do limite final para não descartar um relatório íntegro", () => {
    expect(longEvidence.length).toBeGreaterThan(evaluationLimits.evidence);
    expect(judgeOutputSchema.safeParse(output).success).toBe(true);
    expect(debateEvaluationSchema.safeParse(output).success).toBe(false);
  });
});

describe("normalizeEvaluation", () => {
  it("recorta o excesso e mantém a evidência como trecho literal da fala", () => {
    const evaluation = normalizeEvaluation(judgeOutputSchema.parse(output));

    expect(evaluation.scores.clarity.evidence.length).toBeLessThanOrEqual(evaluationLimits.evidence);
    expect(longEvidence).toContain(evaluation.scores.clarity.evidence);
    expect(evaluation.scores.clarity.evidence).not.toContain("…");
    expect(debateEvaluationSchema.safeParse(evaluation).success).toBe(true);
  });

  it("preserva relatórios que já cabem nos limites", () => {
    const evaluation = normalizeEvaluation(
      judgeOutputSchema.parse({ ...output, scores: { ...output.scores, clarity: score("trecho curto e literal") } }),
    );

    expect(evaluation.scores.clarity.evidence).toBe("trecho curto e literal");
    expect(evaluation.summary).toBe(output.summary);
  });

  it("limita listas a três itens com reticências no corte", () => {
    const evaluation = normalizeEvaluation(
      judgeOutputSchema.parse({
        ...output,
        strengths: ["Primeiro ponto forte.", "Segundo ponto forte.", "Terceiro ponto forte.", "Quarto ponto forte."],
        missedObjection: "a".repeat(evaluationLimits.missedObjection + 40),
      }),
    );

    expect(evaluation.strengths).toHaveLength(3);
    expect(evaluation.missedObjection).toHaveLength(evaluationLimits.missedObjection);
    expect(evaluation.missedObjection.endsWith("…")).toBe(true);
  });
});
