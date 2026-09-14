"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  characters,
  createDebateSession,
  CUSTOM_THEME_ID,
  CUSTOM_THESIS_MAX,
  CUSTOM_THESIS_MIN,
  findCharacter,
  findJudge,
  judges,
  resolveThemeTitle,
  resolveThesis,
  themes,
  type CharacterId,
  type JudgeId,
  type ThemeId,
} from "@/domain";
import { clearActiveSession, saveActiveSession } from "@/lib/debate-storage";
import { trackProductEvent } from "@/lib/telemetry-client";

export default function NewDebatePage() {
  const router = useRouter();
  const [characterId, setCharacterId] = useState<CharacterId>("nietzsche");
  const [judgeId, setJudgeId] = useState<JudgeId>("socrates");
  const [themeId, setThemeId] = useState<ThemeId>("free-will");
  const [customThesis, setCustomThesis] = useState("");
  const [side, setSide] = useState<"favor" | "contra">("favor");
  const [formError, setFormError] = useState("");
  const customThesisInput = useRef<HTMLInputElement | null>(null);

  const character = findCharacter(characterId);
  const judge = findJudge(judgeId);
  const isCustomTheme = themeId === CUSTOM_THEME_ID;
  const trimmedThesis = customThesis.trim();
  const thesis = resolveThesis({ themeId, customThesis: trimmedThesis });
  const themeTitle = resolveThemeTitle({ themeId, customThesis: trimmedThesis });
  const isReady = !isCustomTheme || trimmedThesis.length >= CUSTOM_THESIS_MIN;

  function selectCustomTheme() {
    setThemeId(CUSTOM_THEME_ID);
    setFormError("");
    customThesisInput.current?.focus();
  }

  /* Digitar no campo assume a tese própria; só receber o foco, não — senão
     tabular pelo formulário trocaria o tema escolhido sem a pessoa pedir. */
  function writeCustomThesis(value: string) {
    setCustomThesis(value);
    setThemeId(CUSTOM_THEME_ID);
    if (value.trim().length >= CUSTOM_THESIS_MIN) setFormError("");
  }

  function startDebate() {
    if (!isReady) {
      setFormError(
        `Escreva a sua tese com pelo menos ${CUSTOM_THESIS_MIN} caracteres para entrar no ar.`,
      );
      customThesisInput.current?.focus();
      return;
    }
    setFormError("");
    const now = new Date().toISOString();
    const session = createDebateSession({
      id: crypto.randomUUID(),
      characterId,
      judgeId,
      themeId,
      customThesis: isCustomTheme ? trimmedThesis : undefined,
      userPosition: side === "favor" ? `A favor: ${thesis}` : `Contra: ${thesis}`,
      createdAt: now,
    });
    clearActiveSession();
    saveActiveSession(session);
    trackProductEvent({ event: "debate_started", sessionId: session.id, characterId, judgeId, themeId });
    router.push("/debate/session");
  }

  return (
    <div className="paper-page">
      <SiteHeader />
      <main className="flow-main" id="main-content">
        <header className="flow-heading">
          <div>
            <span className="paper-eyebrow">Pauta nova</span>
            <h1>Monte a sua mesa.</h1>
          </div>
          <p>
            Escolha quem contesta, quem julga e qual lado você vai sustentar.
            Depois que a transmissão começa, o formato mantém o debate no rumo.
          </p>
        </header>

        <div className="setup-layout">
          <div>
            <section className="setup-section">
              <fieldset>
                <legend>Quem vai enfrentar você?</legend>
                <div className="radio-list">
                  {characters.map((item) => (
                    <label className="radio-option" key={item.id}>
                      <input
                        type="radio"
                        name="character"
                        value={item.id}
                        checked={characterId === item.id}
                        onChange={() => setCharacterId(item.id)}
                      />
                      <span className="option-signal" aria-hidden="true" />
                      <span className="option-portrait">
                        <Image
                          src={item.portrait}
                          alt=""
                          width={1122}
                          height={1402}
                          sizes="(max-width: 620px) 92px, 8vw"
                        />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.summary}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className="setup-section">
              <fieldset>
                <legend>Quem observa e julga?</legend>
                <div className="radio-list">
                  {judges.map((item) => (
                    <label className="radio-option" key={item.id}>
                      <input
                        type="radio"
                        name="judge"
                        value={item.id}
                        checked={judgeId === item.id}
                        onChange={() => setJudgeId(item.id)}
                      />
                      <span className="option-signal" aria-hidden="true" />
                      <span className="option-portrait">
                        <Image
                          src={item.portrait}
                          alt=""
                          width={1122}
                          height={1402}
                          sizes="(max-width: 620px) 92px, 8vw"
                        />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.summary}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className="setup-section">
              <fieldset>
                <legend>Qual tese entra em pauta?</legend>
                <div className="radio-list theme-list">
                  {themes.map((item) => (
                    <label className="radio-option" key={item.id}>
                      <input
                        type="radio"
                        name="theme"
                        value={item.id}
                        checked={themeId === item.id}
                        onChange={() => setThemeId(item.id)}
                      />
                      <span className="option-signal" aria-hidden="true" />
                      <strong>{item.thesis}</strong>
                    </label>
                  ))}

                  {/* O campo de texto fica fora do <label> do rádio: dentro dele,
                      o nome acessível do rádio herdaria o conteúdo digitado. */}
                  <div className="radio-option custom-theme">
                    <label className="custom-theme-choice">
                      <input
                        type="radio"
                        name="theme"
                        value={CUSTOM_THEME_ID}
                        checked={isCustomTheme}
                        onChange={selectCustomTheme}
                      />
                      <span className="option-signal" aria-hidden="true" />
                      <strong>Escrever minha própria tese</strong>
                    </label>
                    <input
                      ref={customThesisInput}
                      className="custom-thesis-field"
                      type="text"
                      value={customThesis}
                      onChange={(event) => writeCustomThesis(event.target.value)}
                      maxLength={CUSTOM_THESIS_MAX}
                      placeholder="Ex.: O anonimato online melhora o debate público?"
                      aria-label="Sua tese"
                      aria-describedby="custom-thesis-help"
                    />
                    <small id="custom-thesis-help">
                      {isCustomTheme && trimmedThesis.length > 0 && !isReady
                        ? `Faltam ${CUSTOM_THESIS_MIN - trimmedThesis.length} caracteres para a tese valer.`
                        : `Uma pergunta ou afirmação que tenha dois lados defensáveis. ${customThesis.length} / ${CUSTOM_THESIS_MAX} caracteres.`}
                    </small>
                  </div>
                </div>
              </fieldset>
            </section>

            <section className="setup-section">
              <fieldset>
                <legend>Qual lado você vai defender?</legend>
                <div className="position-switch">
                  <label>
                    <input type="radio" name="side" value="favor" checked={side === "favor"} onChange={() => setSide("favor")} />
                    A favor da tese
                  </label>
                  <label>
                    <input type="radio" name="side" value="contra" checked={side === "contra"} onChange={() => setSide("contra")} />
                    Contra a tese
                  </label>
                </div>
              </fieldset>
            </section>
          </div>

          <aside className="setup-summary" aria-label="Resumo da pauta">
            <span>Pauta pronta para transmissão</span>
            <h2>{themeTitle}</h2>
            <dl>
              <div className="summary-line"><dt>Tese</dt><dd>{thesis || "Escreva sua tese para continuar."}</dd></div>
              <div className="summary-line"><dt>Contra</dt><dd>{character?.name}</dd></div>
              <div className="summary-line"><dt>Juiz</dt><dd>{judge?.name}</dd></div>
              <div className="summary-line"><dt>Você</dt><dd>{side === "favor" ? "A favor" : "Contra"}</dd></div>
              <div className="summary-line"><dt>Formato</dt><dd>6 etapas · 3 falas suas</dd></div>
            </dl>
            <button
              className="submit-action"
              type="button"
              onClick={startDebate}
              aria-disabled={!isReady}
              aria-describedby={formError ? "setup-error" : undefined}
            >
              Entrar no ar
            </button>
            <p className="setup-error" id="setup-error" role="alert">{formError}</p>
            <p className="fine-print">
              As respostas são geradas por IA. Os personagens são interpretações educativas,
              não representações autênticas nem fontes de citações literais.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
