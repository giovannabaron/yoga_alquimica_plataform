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
  const [buscaEmail, setBuscaEmail] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [mensagemAssinatura, setMensagemAssinatura] = useState("");

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

  async function buscarUsuario(e) {
    e.preventDefault();
    setBuscandoUsuario(true);
    setMensagemAssinatura("");
    setUsuarioEncontrado(null);

    const { data: perfil, error } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .ilike("email", buscaEmail.trim())
      .maybeSingle();

    if (error || !perfil) {
      setMensagemAssinatura("Nenhum usuário encontrado com esse e-mail.");
      setBuscandoUsuario(false);
      return;
    }

    const { data: assinatura } = await supabase
      .from("assinaturas")
      .select("valida_ate")
      .eq("user_id", perfil.id)
      .maybeSingle();

    setUsuarioEncontrado({ ...perfil, valida_ate: assinatura?.valida_ate ?? null });
    setBuscandoUsuario(false);
  }

  async function estenderAssinatura(dias) {
    const agora = new Date();
    const baseAtual =
      usuarioEncontrado.valida_ate && new Date(usuarioEncontrado.valida_ate) > agora
        ? new Date(usuarioEncontrado.valida_ate)
        : agora;

    const novaData = new Date(baseAtual.getTime() + dias * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("assinaturas")
      .upsert({ user_id: usuarioEncontrado.id, valida_ate: novaData.toISOString() });

    if (error) {
      setMensagemAssinatura("Erro ao atualizar: " + error.message);
    } else {
      setMensagemAssinatura(`Assinatura estendida até ${novaData.toLocaleDateString("pt-BR")}.`);
      setUsuarioEncontrado({ ...usuarioEncontrado, valida_ate: novaData.toISOString() });
    }
  }

  async function removerAssinatura() {
    const confirmar = window.confirm("Remover o acesso desse usuário agora?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("assinaturas")
      .update({ valida_ate: new Date().toISOString() })
      .eq("user_id", usuarioEncontrado.id);

    if (!error) {
      setUsuarioEncontrado({ ...usuarioEncontrado, valida_ate: new Date().toISOString() });
      setMensagemAssinatura("Acesso removido.");
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

      <h2 style={{ marginTop: "3rem" }}>Gerenciar assinantes</h2>

      <form onSubmit={buscarUsuario} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="email"
          placeholder="E-mail do assinante"
          value={buscaEmail}
          onChange={(e) => setBuscaEmail(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={buscandoUsuario}>
          {buscandoUsuario ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {mensagemAssinatura && <p role="status">{mensagemAssinatura}</p>}

      {usuarioEncontrado && (
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: "1rem" }}>
          <strong>{usuarioEncontrado.nome || "(sem nome)"}</strong>
          <div>{usuarioEncontrado.email}</div>
          <div style={{ margin: "0.5rem 0" }}>
            {usuarioEncontrado.valida_ate && new Date(usuarioEncontrado.valida_ate) > new Date()
              ? `Ativa até ${new Date(usuarioEncontrado.valida_ate).toLocaleDateString("pt-BR")}`
              : "Sem assinatura ativa"}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => estenderAssinatura(30)}>+30 dias</button>
            <button onClick={() => estenderAssinatura(7)}>+7 dias</button>
            <button onClick={removerAssinatura}>Remover acesso</button>
          </div>
        </div>
      )}
    </main>
  );
}