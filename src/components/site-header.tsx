import Link from "next/link";

/**
 * Marca e a única ação que vale em qualquer tela. O selo de status que ficava no
 * meio não dizia nada nem levava a lugar nenhum.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <Link className="brand" href="/" aria-label="debatebros — início">
        debate<span>bros</span>
      </Link>
      <Link className="header-action" href="/debate/new">
        Montar debate
      </Link>
    </header>
  );
}
