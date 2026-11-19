import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import "./Portal.css";

const NIVEIS = [
  { valor: "todos", rotulo: "Todos os níveis" },
  { valor: "iniciante", rotulo: "Iniciante" },
  { valor: "intermediario", rotulo: "Intermediário" },
  { valor: "avancado", rotulo: "Avançado" },
];

export default function Aulas() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
  const [validaAte, setValidaAte] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [aulaAberta, setAulaAberta] = useState(null); // qual aula está com vídeo aberto
  const [filtroNivel, setFiltroNivel] = useState("todos");

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/entrar");
        return;
      }

      const [assinaturaResp, aulasResp] = await Promise.all([
        supabase
          .from("assinaturas")
          .select("valida_ate")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("aulas")
          .select("*")
          .order("liberada_em", { ascending: false }),
      ]);

      const ativa =
        assinaturaResp.data?.valida_ate &&
        new Date(assinaturaResp.data.valida_ate) > new Date();

      setAssinaturaAtiva(ativa);
      setValidaAte(assinaturaResp.data?.valida_ate ?? null);
      setAulas(aulasResp.data ?? []);
      setCarregando(false);
    }

    carregar();
  }, [navigate]);

  function idDoYoutube(url) {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const aulasFiltradas = aulas.filter(
    (a) => filtroNivel === "todos" || a.nivel === filtroNivel || a.nivel === "todos"
  );
  const aulasDisponiveis = assinaturaAtiva
    ? aulasFiltradas
    : aulasFiltradas.filter((aula) => aula.gratuita);

  if (carregando) {
    return (
      <div className="portal-page">
        <SiteHeader />
        <p className="portal-loading">Carregando suas aulas...</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <SiteHeader />
      <main className="portal-main">
        <header className="portal-title-row">
          <div>
            <p className="portal-eyebrow">PRÁTICA E MOVIMENTO</p>
            <h1 className="portal-heading">Sua área</h1>
          </div>
        </header>

      <div className="portal-status">
        {assinaturaAtiva
          ? `Assinatura ativa até ${new Date(validaAte).toLocaleDateString("pt-BR")}.`
          : (
            <>
              <p>Sua assinatura não está ativa. Assine para liberar todas as aulas.</p>
              <Link className="portal-status-link" to="/#plans-title">Ver planos e assinar</Link>
            </>
          )}
      </div>

      <div className="portal-toolbar">
        <label htmlFor="filtro-nivel">
          Nível:
        </label>
        <select
          id="filtro-nivel"
          value={filtroNivel}
          onChange={(e) => setFiltroNivel(e.target.value)}
        >
          {NIVEIS.map((n) => (
            <option key={n.valor} value={n.valor}>
              {n.rotulo}
            </option>
          ))}
        </select>
      </div>

      {aulasDisponiveis.length === 0 && (
        <p>Nenhuma aula encontrada para esse nível ainda.</p>
      )}

      <div className="lesson-list">
        {aulasDisponiveis.map((aula) => {
          const ytId = idDoYoutube(aula.video_url);
          const abertaAgora = aulaAberta === aula.id;

          return (
            <article key={aula.id} className="lesson-card">
              <div className="lesson-meta">
                {new Date(aula.liberada_em).toLocaleDateString("pt-BR")}
                {aula.duracao_min ? ` · ${aula.duracao_min} min` : ""}
                {aula.gratuita ? " · gratuita" : ""}
                {aula.nivel && aula.nivel !== "todos" ? ` · ${aula.nivel}` : ""}
              </div>
              <h2>{aula.titulo}</h2>
              <p>{aula.descricao}</p>

              {abertaAgora && ytId ? (
                <iframe
                  title={aula.titulo}
                  src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                  className="lesson-video"
                  allow="fullscreen"
                  allowFullScreen
                />
              ) : (
                <button className="portal-button" onClick={() => setAulaAberta(aula.id)}>Assistir</button>
              )}
            </article>
          );
        })}
      </div>
      </main>
    </div>
  );
}