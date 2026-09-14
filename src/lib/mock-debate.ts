import {
  findCharacter,
  resolveThesis,
  type DebateEvaluation,
  type DebateSession,
} from "@/domain";

const responses = {
  nietzsche: {
    character_opening:
      "Antes de chamar uma escolha de livre, pergunte quem deseja por meio dela. Muitas decisões apenas obedecem a valores herdados. A liberdade começa quando alguém é capaz de examinar esses valores e criar uma medida própria para a vida.",
    character_rebuttal:
      "Sua defesa confunde sentir-se autor de uma decisão com conhecer as forças que a produziram. Se seus critérios vieram prontos da família, da moral ou do medo, em que sentido a escolha já é verdadeiramente sua?",
    character_counter_rebuttal:
      "Ainda resta um problema: adaptar uma razão depois da escolha não prova liberdade; pode ser apenas a vontade justificando o que já desejava. Mostre como sua posição distingue criação de valores de simples obediência.",
  },
  kant: {
    character_opening:
      "Ser livre não é agir segundo qualquer desejo. Liberdade é autonomia: a capacidade racional de seguir uma regra que também poderia valer para todos. Sem esse princípio, a vontade se torna apenas serva das inclinações.",
    character_rebuttal:
      "Seu argumento depende das consequências que você prefere, mas uma regra moral não pode mudar apenas porque o resultado parece conveniente. Poderia o princípio da sua ação tornar-se uma lei para todas as pessoas?",
    character_counter_rebuttal:
      "A exceção que você propõe preserva seu objetivo, porém enfraquece a universalidade da regra. Falta explicar por que todos poderiam reivindicar a mesma exceção sem destruir o próprio princípio.",
  },
  freud: {
    character_opening:
      "A consciência não governa sozinha a casa psíquica. Desejos reprimidos, conflitos e defesas influenciam escolhas antes que a razão conte uma história coerente sobre elas. Debater liberdade exige reconhecer aquilo que age sem pedir licença ao eu.",
    character_rebuttal:
      "Você oferece uma explicação consciente para sua posição, mas isso não elimina motivações inconscientes. Que evidência permitiria distinguir uma decisão refletida de uma racionalização posterior?",
    character_counter_rebuttal:
      "Reconhecer influências é um começo, não uma solução. Sua conclusão precisa mostrar como o eu pode trabalhar esses conflitos sem apenas trocar uma ilusão de controle por outra.",
  },
  jung: {
    character_opening:
      "Escolhas pessoais também carregam imagens e padrões que não nasceram apenas no indivíduo. A liberdade cresce quando integramos aquilo que rejeitamos em nós mesmos, especialmente a sombra, em vez de deixá-la decidir secretamente.",
    character_rebuttal:
      "Sua posição privilegia a intenção consciente e deixa de lado os aspectos recusados da personalidade. Como chamar de livre uma escolha quando parte de quem escolhe permanece desconhecida?",
    character_counter_rebuttal:
      "Sua resposta reconhece o conflito, mas ainda o trata como obstáculo externo. Uma conclusão mais forte mostraria como integrar a contradição transforma, e não apenas confirma, a identidade de quem decide.",
  },
} as const;

export async function generateMockCharacterTurn(session: DebateSession): Promise<string> {
  await wait(850);
  const characterResponses = responses[session.characterId];
  const stage = session.stage;
  if (
    stage !== "character_opening" &&
    stage !== "character_rebuttal" &&
    stage !== "character_counter_rebuttal"
  ) {
    throw new Error("O personagem não pode falar nesta etapa.");
  }

  return characterResponses[stage];
}

export async function generateMockEvaluation(session: DebateSession): Promise<DebateEvaluation> {
  await wait(1100);
  const userTurns = session.turns.filter((turn) => turn.speaker === "user");
  const totalWords = userTurns.reduce(
    (total, turn) => total + turn.content.split(/\s+/).filter(Boolean).length,
    0,
  );
  const depthBonus = Math.min(2, Math.floor(totalWords / 80));
  const character = findCharacter(session.characterId);
  const thesis = resolveThesis(session);
  const evidence = [
    userTurns[0]?.content ?? "A posição foi apresentada de forma direta.",
    userTurns[1]?.content ?? userTurns[0]?.content ?? "A objeção recebeu uma resposta.",
    userTurns[2]?.content ?? userTurns[0]?.content ?? "A conclusão retomou a tese.",
  ];

  return {
    verdict: depthBonus >= 2 ? "user" : "draw",
    summary:
      depthBonus >= 2
        ? `Você sustentou sua posição contra ${character?.name ?? "o oponente"} e respondeu ao conflito central.`
        : "A disputa permaneceu equilibrada: sua tese ficou clara, mas algumas objeções pediam desenvolvimento adicional.",
    scores: {
      clarity: {
        score: 8,
        evidence: evidence[0],
        justification: "A posição apareceu de forma reconhecível nas três falas.",
      },
      logic: {
        score: 6 + depthBonus,
        evidence: evidence[2],
        justification: "A conclusão retomou a tese, embora algumas premissas pudessem ser explicitadas.",
      },
      engagement: {
        score: 7 + Math.min(1, depthBonus),
        evidence: evidence[1],
        justification: "A réplica respondeu à objeção principal em vez de apenas repetir a abertura.",
      },
      examples: {
        score: 6,
        evidence: evidence[0],
        justification: "O argumento ganharia força com um caso concreto que testasse seus limites.",
      },
      persuasion: {
        score: 7,
        evidence: evidence[2],
        justification: "A defesa permaneceu consistente e encerrou com uma posição compreensível.",
      },
    },
    strengths: ["Tese identificável do início ao fim", "Resposta direta ao ponto do adversário"],
    weaknesses: ["Poucos exemplos concretos", "Uma premissa central permaneceu implícita"],
    missedObjection:
      "Como sua posição se comportaria diante de uma pessoa que escolhe sob forte pressão social ou psicológica?",
    possibleFallacies: ["Possível generalização a partir de uma experiência individual"],
    improvedArgument: `Sobre “${thesis || "a tese"}”: mesmo reconhecendo condicionamentos, podemos chamar uma escolha de livre quando a pessoa identifica alternativas, examina suas razões e aceita revisar a decisão diante de uma objeção consistente.`,
    nextTopic: "Compatibilismo e responsabilidade moral",
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}
