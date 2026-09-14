"use client";

import { useEffect, useRef } from "react";

export interface ReadingContent {
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * Leitura ampliada de um texto longo. Usa <dialog> nativo: o navegador cuida do
 * foco preso, do Esc e da camada acima do restante da página.
 */
export function ReadingModal({
  content,
  onClose,
}: {
  content: ReadingContent | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (content && !element.open) element.showModal();
    if (!content && element.open) element.close();
  }, [content]);

  return (
    <dialog
      className="reading-modal"
      ref={dialog}
      onClose={onClose}
      // Um clique fora do conteúdo tem o próprio <dialog> como alvo: é o backdrop.
      onClick={(event) => { if (event.target === dialog.current) onClose(); }}
      aria-labelledby="reading-title"
    >
      {content && (
        <div className="reading-shell">
          <header className="reading-head">
            <div>
              <span className="paper-eyebrow">{content.eyebrow}</span>
              <h2 id="reading-title">{content.title}</h2>
            </div>
            <button className="reading-close" type="button" onClick={onClose} autoFocus>
              Fechar
              <span aria-hidden="true">✕</span>
            </button>
          </header>
          <div className="reading-body zine-scroll" tabIndex={0}>
            {content.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}
