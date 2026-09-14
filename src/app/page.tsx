import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { characters, judges } from "@/domain";

const stages = ["Abertura", "Seu argumento", "Réplica", "Sua réplica", "Tréplica", "Conclusão"];

const heroFacts = [
  { icon: "speech" as const, title: "Debate com IA", text: "Simulações educativas de grandes pensadores." },
  { icon: "bolt" as const, title: "Oponentes históricos", text: "Quatro mentes com posições próprias." },
  { icon: "chart" as const, title: "Veredito com evidência", text: "Notas citando as suas próprias falas." },
];

const promises = [
  { title: "Oponentes históricos", text: "Debata com filósofos e pensadores que discordam de você." },
  { title: "Você escolhe", text: "Defina o tema, o oponente e quem vai julgar." },
  { title: "Etapas bem definidas", text: "Abertura, réplica, tréplica e veredito. Sem conversa infinita." },
  { title: "Aprenda enquanto debate", text: "Veja pontos fortes, falhas e como apertar o argumento." },
];

const manifestoJudge = judges[0];

export default function Home() {
  return (
    <div className="paper-page home-page">
      <SiteHeader />
      <main id="main-content">
        <section className="home-hero">
          <div className="hero-copy">
            <span className="paper-eyebrow">Ideias em confronto</span>
            <h1>Entre no ar.<br /><span>Sustente seu ponto.</span></h1>
            <p>
              Enfrente uma grande mente, responda às objeções e descubra o que
              um juiz histórico diria sobre a sua argumentação.
            </p>
            <div className="hero-actions">
              <Link className="primary-action" href="/debate/new">
                Começar agora <span aria-hidden="true">→</span>
              </Link>
              <Link className="ghost-action" href="#elenco">Ver o elenco</Link>
            </div>
            <ul className="hero-facts">
              {heroFacts.map((fact) => (
                <li key={fact.title}>
                  <FactIcon name={fact.icon} />
                  <div>
                    <strong>{fact.title}</strong>
                    <span>{fact.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-art">
            <Image
              src="/hero-cast.webp"
              alt="Recortes de Nietzsche, Kant e Freud em volta de uma figura encapuzada, que representa você."
              width={1600}
              height={901}
              sizes="(max-width: 900px) 92vw, 50vw"
              priority
            />
            <p className="collage-note">Ideias. Pessoas.<br />Conversas melhores.</p>
          </div>
        </section>

        <section className="flow-strip" aria-label="Como o debate acontece">
          <h2>Seis etapas.<br />A última é o veredito.</h2>
          <ol>
            {stages.map((stage, index) => (
              <li key={stage}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                {stage}
              </li>
            ))}
          </ol>
        </section>

        <section className="home-manifesto">
          <div className="manifesto-copy">
            <span className="paper-eyebrow">Mais que opiniões</span>
            <h2>Não é um chat.<br />É um debate <span>que termina.</span></h2>
            <p>
              Cada fala tem uma função. O oponente precisa enfrentar seu argumento;
              você precisa responder; o juiz precisa explicar o veredito com base na transcrição.
            </p>
          </div>

          <figure className="manifesto-figure">
            <Image
              src={manifestoJudge.portrait}
              alt={`Retrato em colagem de ${manifestoJudge.name}`}
              width={1122}
              height={1402}
              sizes="(max-width: 900px) 60vw, 26vw"
            />
            <figcaption>Boas perguntas levam mais longe.</figcaption>
          </figure>

          <ol className="promise-list">
            {promises.map((promise, index) => (
              <li key={promise.title}>
                <div>
                  <strong>{promise.title}</strong>
                  <span>{promise.text}</span>
                </div>
                <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-cast" id="elenco">
          <header className="cast-heading">
            <span className="paper-eyebrow">O elenco</span>
            <h2>Quem entra na mesa.</h2>
            <p>Quatro oponentes para enfrentar e três juízes para avaliar a sua defesa.</p>
          </header>
          <ul className="cast-grid">
            {[...characters, ...judges].map((member) => (
              <li key={member.id}>
                <div className="cast-thumb">
                  <Image
                    src={member.portrait}
                    alt={`Retrato em colagem de ${member.name}`}
                    width={1122}
                    height={1402}
                    sizes="(max-width: 620px) 45vw, 16vw"
                  />
                </div>
                <strong>{member.name}</strong>
                <span>{"lifespan" in member ? "Oponente" : "Juiz"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-band">
          <p className="band-motto">Grandes ideias<br />para um mundo melhor.</p>
          <div className="band-note">
            <span className="paper-eyebrow">Nota de produção</span>
            <p>
              Os personagens são simulações educativas baseadas em ideias publicadas.
              Nenhuma resposta gerada representa uma fala autêntica ou uma citação literal.
            </p>
          </div>
          <Link className="band-action" href="/debate/new">
            Montar debate <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}

function FactIcon({ name }: { name: "speech" | "bolt" | "chart" }) {
  const paths = {
    speech: <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v7a1.5 1.5 0 0 1-1.5 1.5H8l-4 3v-3H4.5A1.5 1.5 0 0 1 3 12.5z" />,
    bolt: <path d="M11 2 4 11h5l-1 7 7-9h-5z" />,
    chart: <path d="M4 16V9m5 7V4m5 12v-5m4 5H3" />,
  };
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
