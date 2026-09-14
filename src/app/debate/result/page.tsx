"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ReadingModal, type ReadingContent } from "@/components/reading-modal";
import { SiteHeader } from "@/components/site-header";
import {
  findCharacter,
  findJudge,
  resolveThesis,
  scoreDimensionLabels,
  type DebateSession,
  type ScoreDimension,
} from "@/domain";
import { useHydrated } from "@/hooks/use-hydrated";
import { loadLastResult } from "@/lib/debate-storage";
import { trackProductEvent } from "@/lib/telemetry-client";

const verdictLabels = {
  user: "Você venceu",
  character: "Oponente venceu",
  draw: "Empate técnico",
} as const;

const MAX_TOTAL = 50;

export default function DebateResultPage() {
  const [session] = useState<DebateSession | null>(() => loadLastResult());
  const hydrated = useHydrated();
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [reading, setReading] = useState<ReadingContent | null>(null);

  if (!hydrated) return <div className="paper-page" />;

  if (!session?.evaluation) {
    return (
      <div className="paper-page">
        <SiteHeader />
        <main className="empty-state" id="main-content">
          <h1>O juiz ainda não deliberou.</h1>
          <p>Conclua um debate para receber uma avaliação baseada na transcrição.</p>
          <Link className="primary-action" href="/debate/new">Começar um debate</Link>
        </main>
      </div>
    );
  }

  const evaluation = session.evaluation;
  const character = findCharacter(session.characterId);
  const judge = findJudge(session.judgeId);
  const thesis = resolveThesis(session);
  const scores = Object.entries(evaluation.scores) as [
    ScoreDimension,
    (typeof evaluation.scores)[ScoreDimension],
  ][];
  const total = scores.reduce((sum, [, result]) => sum + result.score, 0);
  const best = scores.reduce((top, entry) => (entry[1].score > top[1].score ? entry : top));

  function submitFeedback(value: "yes" | "no") {
    setFeedback(value);
    trackProductEvent({ event: "feedback_submitted", sessionId: session!.id, value });
  }

  return (
    <div className="paper-page">
      <SiteHeader />
      <main className="result-main" id="main-content">
        <header className="verdict">
          <div className="verdict-card">
            <span className="verdict-signal">
              <span className="verdict-face">
                <Image src={judge!.portrait} alt="" width={1122} height={1402} sizes="56px" />
              </span>
              Veredito de {judge?.name}
            </span>
            <h1>{verdictLabels[evaluation.verdict]}</h1>
            <p className="verdict-line">{thesis} · contra {character?.name}</p>
          </div>

          <p className="verdict-summary">{evaluation.summary}</p>

          <div className="verdict-total">
            <b>{total}</b>
            <span aria-hidden="true">/ {MAX_TOTAL}</span>
            <small>seu placar</small>
            <span className="sr-only">de {MAX_TOTAL} pontos possíveis</span>
          </div>
        </header>

        {/* Placar antes das explicações: a nota é lida de relance, o porquê é opcional. */}
        <section className="scoreline" aria-label="Notas da avaliação">
          <ol>
            {scores.map(([dimension, result]) => (
              <li key={dimension} className={dimension === best[0] ? "is-best" : undefined}>
                <b>{result.score}</b>
                <span className="scoreline-label">
                  {scoreDimensionLabels[dimension]}
                  {dimension === best[0] && <i>melhor nota</i>}
                </span>
                <div
                  className="scoreline-bar"
                  role="progressbar"
                  aria-valuenow={result.score}
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-label={scoreDimensionLabels[dimension]}
                >
                  <i style={{ transform: `scaleX(${result.score / 10})` }} />
                </div>
                <button
                  className="read-action"
                  type="button"
                  onClick={() =>
                    setReading({
                      eyebrow: scoreDimensionLabels[dimension],
                      title: `Nota ${result.score} de 10`,
                      body: `“${result.evidence}”\n\n${result.justification}`,
                    })
                  }
                >
                  Por quê?
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="stronger">
          <span className="paper-eyebrow">Leve isto para o próximo</span>
          <h2>Uma versão mais forte</h2>
          <p>{evaluation.improvedArgument}</p>
        </section>

        <div className="takeaways">
          <section className="takeaway takeaway--good">
            <h2>Funcionou</h2>
            <ul>{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="takeaway takeaway--work">
            <h2>Apertar</h2>
            <ul>{evaluation.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="takeaway takeaway--open">
            <h2>Ficou no ar</h2>
            <p>{evaluation.missedObjection}</p>
            {evaluation.possibleFallacies.length > 0 && (
              <button
                className="read-action"
                type="button"
                onClick={() =>
                  setReading({
                    eyebrow: "Hipóteses do juiz",
                    title: evaluation.possibleFallacies.length === 1 ? "Possível falácia" : "Possíveis falácias",
                    body: evaluation.possibleFallacies.join("\n\n"),
                  })
                }
              >
                Ver {evaluation.possibleFallacies.length === 1 ? "a falácia apontada" : `as ${evaluation.possibleFallacies.length} falácias apontadas`}
              </button>
            )}
          </section>
        </div>

        <section className="next-round">
          <div>
            <span className="paper-eyebrow">Próximo round</span>
            <p>{evaluation.nextTopic}</p>
          </div>
          <Link className="primary-action" href="/debate/new">
            Montar outro debate <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="result-feedback" aria-live="polite" aria-label="Avalie este relatório">
          {feedback ? (
            <p>Resposta registrada neste protótipo. Obrigado.</p>
          ) : (
            <>
              <p>Esta avaliação foi útil?</p>
              <button className="text-action" type="button" onClick={() => submitFeedback("yes")}>Sim</button>
              <button className="text-action" type="button" onClick={() => submitFeedback("no")}>Ainda não</button>
            </>
          )}
        </section>
      </main>
      <ReadingModal content={reading} onClose={() => setReading(null)} />
    </div>
  );
}
