"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { ReadingModal, type ReadingContent } from "@/components/reading-modal";
import { StageRundown } from "@/components/stage-rundown";
import {
  appendTurn,
  completeDebate,
  expectedSpeaker,
  findCharacter,
  findJudge,
  resolveThesis,
  scoreDimensionLabels,
  stageCopy,
  PLAYER_PORTRAIT,
  type DebateSession,
} from "@/domain";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  loadActiveSession,
  saveActiveSession,
  saveLastResult,
} from "@/lib/debate-storage";
import { requestEvaluation, streamCharacterTurn } from "@/lib/ai-client";
import { trackProductEvent } from "@/lib/telemetry-client";

type TransmissionStatus = "idle" | "loading" | "error";

const TOTAL_TURNS = 6;
const participantChips = ["Sua perspectiva", "Argumentos", "Impacto real"];

export default function DebateSessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<DebateSession | null>(() => loadActiveSession());
  const hydrated = useHydrated();
  const [argument, setArgument] = useState("");
  const [status, setStatus] = useState<TransmissionStatus>("idle");
  const [error, setError] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const activeRequest = useRef<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const argumentInput = useRef<HTMLTextAreaElement | null>(null);
  const retryButton = useRef<HTMLButtonElement | null>(null);
  const streamingSpeech = useRef<HTMLParagraphElement | null>(null);
  const [reading, setReading] = useState<ReadingContent | null>(null);

  const runAutomaticStage = useCallback(async (current: DebateSession) => {
    const requestKey = `${current.id}:${current.stage}`;
    if (activeRequest.current === requestKey) return;
    activeRequest.current = requestKey;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setStatus("loading");
    setError("");
    setStreamedText("");

    try {
      if (expectedSpeaker(current.stage) === "character") {
        const content = await streamCharacterTurn(
          current,
          setStreamedText,
          controller.signal,
        );
        const updated = appendTurn(current, {
          id: crypto.randomUUID(),
          speaker: "character",
          content,
          createdAt: new Date().toISOString(),
        });
        saveActiveSession(updated);
        setSession(updated);
      } else if (current.stage === "judging") {
        const evaluation = await requestEvaluation(current, controller.signal);
        const completed = completeDebate(current, evaluation, new Date().toISOString());
        saveActiveSession(completed);
        saveLastResult(completed);
        trackProductEvent({
          event: "debate_completed",
          sessionId: completed.id,
          characterId: completed.characterId,
          judgeId: completed.judgeId,
          themeId: completed.themeId,
        });
        setSession(completed);
        router.push("/debate/result");
      }
      setStatus("idle");
      setStreamedText("");
      activeRequest.current = null;
      abortController.current = null;
    } catch (caught) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "A transmissão foi interrompida.");
    }
  }, [router]);

  useEffect(() => () => abortController.current?.abort(), []);

  // A fala em transmissão acompanha o fim do texto enquanto o bloco rola sozinho.
  useEffect(() => {
    const element = streamingSpeech.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [streamedText]);

  useEffect(() => {
    if (status === "error") {
      retryButton.current?.focus();
    } else if (status === "idle" && session && expectedSpeaker(session.stage) === "user") {
      argumentInput.current?.focus();
    }
  }, [session, status]);

  useEffect(() => {
    if (!session || status !== "idle") return;
    if (expectedSpeaker(session.stage) === "character" || session.stage === "judging") {
      const timer = globalThis.setTimeout(() => void runAutomaticStage(session), 0);
      return () => globalThis.clearTimeout(timer);
    }
  }, [runAutomaticStage, session, status]);

  function retry() {
    if (!session) return;
    abortController.current?.abort();
    activeRequest.current = null;
    setStatus("idle");
    void runAutomaticStage(session);
  }

  function submitArgument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || expectedSpeaker(session.stage) !== "user" || argument.trim().length < 20) return;

    const updated = appendTurn(session, {
      id: crypto.randomUUID(),
      speaker: "user",
      content: argument,
      createdAt: new Date().toISOString(),
    });
    saveActiveSession(updated);
    setArgument("");
    setSession(updated);
  }

  if (!hydrated) {
    return <div className="paper-page"><LoadingMessage label="Recuperando a pauta" /></div>;
  }

  if (!session) {
    return (
      <div className="paper-page">
        <SiteHeader />
        <main className="zine-empty" id="main-content">
          <h1>Nenhuma pauta no ar.</h1>
          <p>Monte um debate para definir oponente, juiz, tema e sua posição.</p>
          <Link className="zine-send" href="/debate/new">Montar debate</Link>
        </main>
      </div>
    );
  }

  const character = findCharacter(session.characterId);
  const judge = findJudge(session.judgeId);
  const thesis = resolveThesis(session);
  const copy = stageCopy[session.stage];
  const latestTurn = session.turns.at(-1);
  const isUserTurn = expectedSpeaker(session.stage) === "user";
  const stageIndex = Math.min(session.turns.length + 1, TOTAL_TURNS);

  return (
    <div className="paper-page session-page">
      <SiteHeader />
      <main className="zine-main" id="main-content">
        <header className="zine-topic">
          <span className="paper-eyebrow">Tese em debate</span>
          <h1 title={thesis}>{highlightTail(thesis)}</h1>
          <span className="paper-rule" aria-hidden="true" />
          <div className="zine-topic-foot">
            <p className="zine-position zine-scroll" tabIndex={0}>
              Sua posição: <strong>{session.userPosition}</strong>
            </p>
            <button
              className="read-action"
              type="button"
              onClick={() => setReading({ eyebrow: "Tese em debate", title: thesis, body: session.userPosition })}
            >
              Ler tese completa
            </button>
          </div>
        </header>

        <div className="zine-desk">
          <aside className="cast-card cast-card--opponent">
            <div className="cast-portrait">
              <Image
                src={character?.portrait ?? PLAYER_PORTRAIT}
                alt={`Retrato em colagem de ${character?.name}`}
                width={1122}
                height={1402}
                sizes="(max-width: 620px) 120px, (max-width: 1100px) 45vw, 22vw"
                priority
              />
            </div>
            <div className="cast-body">
              <span className="cast-role">Canal A · Oponente</span>
              <h2>{character?.name}</h2>
              <p className="zine-scroll" tabIndex={0}>{character?.summary}</p>
              <ul className="chip-row">
                {character?.coreIdeas.slice(0, 3).map((idea) => <li key={idea}>{idea}</li>)}
              </ul>
            </div>
          </aside>

          <section className="stage-card" aria-busy={status === "loading"}>
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {status === "loading"
                ? session.stage === "judging"
                  ? "O juiz está deliberando."
                  : `${character?.name} está formulando uma resposta.`
                : status === "error"
                  ? error
                  : isUserTurn && latestTurn?.speaker === "character"
                    ? `Resposta de ${character?.name} concluída. Sua vez de argumentar.`
                    : ""}
            </p>
            <div className="stage-top">
              <span className="stage-badge">
                <i aria-hidden="true">{String(stageIndex).padStart(2, "0")}</i>
                {copy.shortLabel}
              </span>
              <time className="stage-count">
                {session.turns.length} / {TOTAL_TURNS} falas registradas
              </time>
              {latestTurn && (
                <button
                  className="read-action"
                  type="button"
                  onClick={() =>
                    setReading({
                      eyebrow: latestTurn.speaker === "character" ? "Fala do oponente" : "Sua fala",
                      title: latestTurn.speaker === "character" ? character?.name ?? "Oponente" : "Você",
                      body: latestTurn.content,
                    })
                  }
                >
                  Ler em tela cheia
                </button>
              )}
            </div>
            <div
              className="stage-progress"
              role="progressbar"
              aria-valuenow={session.turns.length}
              aria-valuemin={0}
              aria-valuemax={TOTAL_TURNS}
              aria-label="Falas registradas"
            >
              <span style={{ transform: `scaleX(${session.turns.length / TOTAL_TURNS})` }} />
            </div>
            <h3>{copy.title}</h3>
            <p className="stage-instruction" id="argument-guidance">{copy.instruction}</p>

            {status === "loading" && streamedText ? (
              <p
                ref={streamingSpeech}
                className="speech speech--streaming zine-scroll"
                aria-live="off"
                tabIndex={0}
              >
                {streamedText}<i aria-hidden="true" />
                <cite>{character?.name} · ao vivo</cite>
              </p>
            ) : status === "loading" ? (
              <LoadingMessage label={session.stage === "judging" ? "O juiz está deliberando" : `${character?.name} está formulando a resposta`} />
            ) : status === "error" ? (
              <div className="zine-error" role="alert">
                <strong>O sinal caiu.</strong>
                <p>{error}</p>
                <button ref={retryButton} type="button" onClick={retry}>Tentar novamente</button>
              </div>
            ) : isUserTurn ? (
              <form className="zine-form" onSubmit={submitArgument}>
                {latestTurn && (
                  <p className="speech speech--quoted zine-scroll" tabIndex={0}>
                    {latestTurn.content}
                    <cite>Última fala · {latestTurn.speaker === "character" ? character?.name : "você"}</cite>
                  </p>
                )}
                <label className="sr-only" htmlFor="argument">Seu argumento</label>
                <textarea
                  ref={argumentInput}
                  id="argument"
                  value={argument}
                  minLength={20}
                  maxLength={900}
                  onChange={(event) => setArgument(event.target.value)}
                  placeholder="Responda ao ponto central. Use pelo menos 20 caracteres."
                  aria-describedby="argument-guidance argument-count"
                  required
                />
                <div className="zine-form-footer">
                  <span id="argument-count">{argument.length} / 900 caracteres</span>
                </div>
                <button className="zine-send" type="submit" disabled={argument.trim().length < 20}>
                  {session.stage === "user_conclusion" ? "Enviar para o juiz" : "Transmitir argumento"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            ) : latestTurn ? (
              <p className="speech zine-scroll" tabIndex={0}>
                {latestTurn.content}
                <cite>{character?.name}</cite>
              </p>
            ) : null}
          </section>

          <aside className="cast-card cast-card--you">
            <div className="cast-portrait">
              <Image
                src={PLAYER_PORTRAIT}
                alt="Retrato em colagem do participante"
                width={1122}
                height={1402}
                sizes="(max-width: 620px) 120px, (max-width: 1100px) 45vw, 22vw"
              />
            </div>
            <div className="cast-body">
              <span className="cast-role">Canal B · Participante</span>
              <h2>Você</h2>
              <p className="zine-scroll" tabIndex={0}>{session.userPosition}</p>
              <ul className="chip-row">
                {participantChips.map((chip) => <li key={chip}>{chip}</li>)}
              </ul>
            </div>
          </aside>
        </div>

        <div className="judge-strip">
          <div className="judge-face">
            <Image
              src={judge?.portrait ?? PLAYER_PORTRAIT}
              alt={`Retrato em colagem de ${judge?.name}`}
              width={1122}
              height={1402}
            />
          </div>
          <div className="judge-text">
            <span>Na escuta · juiz</span>
            <strong>{judge?.name}</strong>
            <p>
              {judge?.summary} Observa{" "}
              {judge?.priorities.map((priority) => scoreDimensionLabels[priority].toLowerCase()).join(", ")}.
            </p>
          </div>
        </div>

        <StageRundown current={session.stage} />
      </main>
      <ReadingModal content={reading} onClose={() => setReading(null)} />
    </div>
  );
}

/** Destaca o fim da tese com a faixa de fita adesiva. */
function highlightTail(thesis: string) {
  const words = thesis.split(" ");
  if (words.length < 2) return thesis;
  const tailSize = words.length >= 4 ? 2 : 1;
  const head = words.slice(0, -tailSize).join(" ");
  const tail = words.slice(-tailSize).join(" ");
  return (
    <>
      {head} <mark>{tail}</mark>
    </>
  );
}

function LoadingMessage({ label }: { label: string }) {
  return (
    <div className="zine-loading" role="status">
      <div>
        <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <span>{label}…</span>
      </div>
    </div>
  );
}
