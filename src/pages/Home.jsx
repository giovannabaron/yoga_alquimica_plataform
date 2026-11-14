import { Link } from "react-router-dom";
import "./Home.css";

const planos = [
  {
    nome: "Mensal",
    preco: "R$ 36,90",
    periodo: "/mês",
    descricao: "Renovação mensal, cancele quando quiser.",
  },
  {
    nome: "Anual",
    preco: "R$ 369,00",
    periodo: "/ano",
    descricao: "Equivale a R$ 30,75/mês",
    economia: true,
  },
];

export default function Home() {
  return (
    <main className="home-shell">
      <header className="home-header">
        <Link className="home-brand" to="/" aria-label="Yoga Alquímica, início">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>Yoga Alquímica</span>
        </Link>
        <Link className="header-login" to="/entrar">Entrar</Link>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=2200&q=85"
          alt="Prática de yoga ao ar livre"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">PRÁTICA, PRESENÇA, TRANSFORMAÇÃO</p>
          <h1 id="home-title">Yoga<br />Alquímica</h1>
          <p className="hero-copy">
            Aulas de yoga gravadas, liberadas toda semana, para praticar no seu ritmo.
          </p>
          <Link className="primary-link" to="/entrar">
            Começar agora <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <span className="hero-caption">UM ESPAÇO PARA VOLTAR A SI</span>
      </section>

      <section className="about-section" aria-labelledby="about-title">
        <p className="eyebrow section-eyebrow">UM PROJETO DE EXTENSÃO</p>
        <div className="about-grid">
          <h2 id="about-title">A prática deve<br />chegar a todos.</h2>
          <blockquote>
            “O acesso a uma prática de yoga com técnica de qualidade ainda é muito
            elitizado. Penso que é muito importante que esse movimento chegue em
            todos.”
          </blockquote>
        </div>
      </section>

      <section className="plans-section" aria-labelledby="plans-title">
        <div className="plans-heading">
          <div>
            <p className="eyebrow section-eyebrow">ESCOLHA SEU RITMO</p>
            <h2 id="plans-title">Planos</h2>
          </div>
          <p>Acesso às aulas para cultivar uma prática possível, semana após semana.</p>
        </div>

        <div className="plans-grid">
          {planos.map((plano) => (
            <article className={`plan-item${plano.economia ? " plan-featured" : ""}`} key={plano.nome}>
              {plano.economia && <span className="saving-label">ECONOMIZE</span>}
              <h3>{plano.nome}</h3>
              <p className="plan-price">
                <span>{plano.preco}</span>
                <small>{plano.periodo}</small>
              </p>
              <p className="plan-description">{plano.descricao}</p>
              {plano.economia && <p className="plan-strike"><s>R$ 442,80</s> no ano</p>}
              <Link className="plan-link" to="/entrar">
                Assinar <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <Link className="home-brand footer-brand" to="/">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>Yoga Alquímica</span>
        </Link>
        <span>Projeto de extensão</span>
      </footer>
    </main>
  );
}