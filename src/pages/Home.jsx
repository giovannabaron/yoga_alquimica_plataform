import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import logo from "../assets/logo1.png";
import "./Home.css";

const planos = [
	{
		id: "mensal",
		nome: "Mensal",
		preco: "R$ 36,90",
		periodo: "/ 30 dias",
		descricao: "Acesso por 30 dias. Renove quando quiser.",
	},
	{
		id: "anual",
		nome: "Anual",
		preco: "R$ 369,00",
		periodo: "/ 365 dias",
		descricao: "Equivale a R$ 30,75 por mês.",
		economia: true,
	},
];

export default function Home() {
	return (
		<main className="home-shell">
			<SiteHeader />

			<section className="home-hero" aria-labelledby="home-title">
				<img
					className="hero-image"
					src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=2200&q=85"
					alt="Prática de Yôga ao ar livre"
				/>
				<div className="hero-shade" />
				<div className="hero-content">
					<p className="eyebrow">PRÁTICA, PRESENÇA, TRANSFORMAÇÃO</p>
					<h1 id="home-title">
						Yôga
						<br />
						Alquímica
					</h1>
					<p className="hero-copy">
						Aulas de Yôga gravadas, liberadas toda semana, para praticar no seu
						ritmo.
					</p>
					<Link className="primary-link" to="/entrar">
						Começar agora <span aria-hidden="true">↗</span>
					</Link>
				</div>
				<span className="hero-caption">UM ESPAÇO PARA VOLTAR A SI</span>
			</section>

			<section className="about-section" aria-labelledby="about-title">
				<div className="about-grid">
					<h2 id="about-title">
						A prática deve
						<br />
						chegar a todos.
					</h2>
					<blockquote>
						“O acesso a uma prática de Yôga com técnica de qualidade ainda é muito
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
					<p>
						Acesso às aulas para cultivar uma prática possível, semana após semana.
					</p>
				</div>

				<div className="plans-grid">
					{planos.map((plano) => (
						<article
							className={`plan-item${
								plano.economia ? " plan-featured" : ""
							}`}
							key={plano.nome}
						>
							{plano.economia && (
								<span className="saving-label">ECONOMIZE</span>
							)}
							<h3>{plano.nome}</h3>
							<p className="plan-price">
								<span>{plano.preco}</span>
								<small>{plano.periodo}</small>
							</p>
							<p className="plan-description">{plano.descricao}</p>
							{plano.economia && (
								<p className="plan-strike">
									<s>R$ 442,80</s> no ano
								</p>
							)}
							<Link className="plan-link" to={`/assinar/${plano.id}`}>
								Assinar <span aria-hidden="true">↗</span>
							</Link>
						</article>
					))}
				</div>
			</section>

			<footer className="home-footer">
				<img className="home-footer-logo" src={logo} alt="Yôga Alquímica" />
				<a
					className="home-footer-social"
					href="https://www.instagram.com/yoga.alquimica"
					target="_blank"
					rel="noopener noreferrer"
				>
					@yoga.alquimica
				</a>
			</footer>
		</main>
	);
}