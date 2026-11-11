import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const NIVEIS = [
  { valor: "todos", rotulo: "Todos os níveis" },
  { valor: "iniciante", rotulo: "Iniciante" },
  { valor: "intermediario", rotulo: "Intermediário" },
  { valor: "avancado", rotulo: "Avançado" },
];

export default function Admin() {
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [ehAdmin, setEhAdmin] = useState(false);
  const [aulas, setAulas] = useState([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duracaoMin, setDuracaoMin] = useState("");
  const [nivel, setNivel] = useState("todos");
  const [gratuita, setGratuita] = useState(false);
  const [liberadaEm, setLiberadaEm] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarAulas() {
    const { data } = await supabase
      .from("aulas")
      .select("*")
      .order("liberada_em", { ascending: false });
    setAulas(data ?? []);
  }

  useEffect(() => {
    async function verificarAdmin() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/entrar");
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!perfil?.is_admin) {
        navigate("/aulas");
        return;
      }

      setEhAdmin(true);
  carregarAulas();
      setVerificando(false);
    }

    verificarAdmin();
  }, [navigate]);

  async function cadastrarAula(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem("");

    const { error } = await supabase.from("aulas").insert({
      titulo,
      descricao,
      video_url: videoUrl,
      duracao_min: duracaoMin ? Number(duracaoMin) : null,
      nivel,
      gratuita,
      liberada_em: liberadaEm
        ? new Date(liberadaEm).toISOString()
        : new Date().toISOString(),
    });

    if (error) {
      setMensagem("Erro ao cadastrar: " + error.message);
    } else {
      setMensagem("Aula cadastrada com sucesso!");
      await carregarAulas();
      setTitulo("");
      setDescricao("");
      setVideoUrl("");
      setDuracaoMin("");
      setNivel("todos");
      setGratuita(false);
      setLiberadaEm("");
    }

    setSalvando(false);
  }

  async function apagarAula(id, tituloAula) {
    const confirmar = window.confirm(
      `Apagar a aula "${tituloAula}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    const { error } = await supabase.from("aulas").delete().eq("id", id);

    if (error) {
      alert("Erro ao apagar: " + error.message);
    } else {
      await carregarAulas();
    }
  }

  if (verificando) {
    return <p style={{ padding: "2rem" }}>Verificando acesso...</p>;
  }

  if (!ehAdmin) {
    return null;
  }

  return (
    <main style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Painel da professora</h1>
      <h2>Cadastrar aula nova</h2>

      <form onSubmit={cadastrarAula} style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="videoUrl">Link do vídeo (YouTube)</label>
          <input
            id="videoUrl"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label htmlFor="duracao">Duração (minutos)</label>
          <input
            id="duracao"
            type="number"
            value={duracaoMin}
            onChange={(e) => setDuracaoMin(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nivel">Nível</label>
          <select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            {NIVEIS.map((n) => (
              <option key={n.valor} value={n.valor}>
                {n.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={gratuita}
              onChange={(e) => setGratuita(e.target.checked)}
            />
            {" "}Aula gratuita (não precisa de assinatura)
          </label>
        </div>

        <div>
          <label htmlFor="liberadaEm">Data de liberação</label>
          <input
            id="liberadaEm"
            type="datetime-local"
            value={liberadaEm}
            onChange={(e) => setLiberadaEm(e.target.value)}
          />
          <small>Deixe em branco para liberar imediatamente.</small>
        </div>

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Cadastrar aula"}
        </button>

        <p role="status">{mensagem}</p>
      </form>

      <h2 style={{ marginTop: "3rem" }}>Aulas cadastradas ({aulas.length})</h2>

      {aulas.length === 0 && <p>Nenhuma aula cadastrada ainda.</p>}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {aulas.map((aula) => (
          <div
            key={aula.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div>
              <strong>{aula.titulo}</strong>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                {new Date(aula.liberada_em).toLocaleDateString("pt-BR")}
                {" · "}
                {aula.nivel}
                {aula.gratuita ? " · gratuita" : ""}
              </div>
            </div>
            <button onClick={() => apagarAula(aula.id, aula.titulo)}>Apagar</button>
          </div>
        ))}
      </div>
    </main>
  );
}