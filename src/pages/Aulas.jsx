import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

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

  async function sair() {
    await supabase.auth.signOut();
    navigate("/entrar");
  }

  function idDoYoutube(url) {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const aulasFiltradas = aulas.filter(
    (a) => filtroNivel === "todos" || a.nivel === filtroNivel || a.nivel === "todos"
  );

  if (carregando) {
    return <p style={{ padding: "2rem" }}>Carregando...</p>;
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Suas aulas</h1>
        <button onClick={sair}>Sair</button>
      </header>

      <div style={{ background: "#eee", padding: "1rem", borderRadius: 8, margin: "1rem 0" }}>
        {assinaturaAtiva
          ? `Assinatura ativa até ${new Date(validaAte).toLocaleDateString("pt-BR")}.`
          : "Sua assinatura não está ativa. Você vê só as aulas gratuitas."}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="filtro-nivel" style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
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

      {aulasFiltradas.length === 0 && (
        <p>Nenhuma aula encontrada para esse nível ainda.</p>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {aulasFiltradas.map((aula) => {
          const ytId = idDoYoutube(aula.video_url);
          const abertaAgora = aulaAberta === aula.id;

          return (
            <article key={aula.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: "1rem" }}>
              <div style={{ fontWeight: "bold", color: "#0f4c4a", fontSize: "0.9rem" }}>
                {new Date(aula.liberada_em).toLocaleDateString("pt-BR")}
                {aula.duracao_min ? ` · ${aula.duracao_min} min` : ""}
                {aula.gratuita ? " · gratuita" : ""}
                {aula.nivel && aula.nivel !== "todos" ? ` · ${aula.nivel}` : ""}
              </div>
              <h3>{aula.titulo}</h3>
              <p>{aula.descricao}</p>

              {abertaAgora && ytId ? (
                <iframe
                  title={aula.titulo}
                  src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                  style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 8 }}
                  allow="fullscreen"
                  allowFullScreen
                />
              ) : (
                <button onClick={() => setAulaAberta(aula.id)}>Assistir</button>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}