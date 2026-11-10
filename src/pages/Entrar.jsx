import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Entrar() {
  const navigate = useNavigate();
  const [criarConta, setCriarConta] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setCarregando(true);
    setMensagem("");

    if (criarConta) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });

      if (error) {
        setMensagem("Não foi possível criar a conta. Verifique os dados.");
      } else if (data.session) {
        navigate("/aulas");
      } else {
        setMensagem("Conta criada! Confira seu e-mail para confirmar o cadastro.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setMensagem("E-mail ou senha incorretos.");
      } else {
        navigate("/aulas");
      }
    }

    setCarregando(false);
  }

  async function esqueciSenha() {
    if (!email) {
      setMensagem("Digite seu e-mail no campo acima primeiro.");
      return;
    }
    setEnviandoReset(true);
    setMensagem("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      setMensagem("Não foi possível enviar o e-mail. Tente novamente.");
    } else {
      setMensagem("Enviamos um link para o seu e-mail. Confira sua caixa de entrada.");
    }
    setEnviandoReset(false);
  }

  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>{criarConta ? "Criar conta" : "Entrar"}</h1>

      <form onSubmit={enviar}>
        {criarConta && (
          <div>
            <label htmlFor="nome">Seu nome</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
        )}

        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="senha">Senha (mínimo 6 caracteres)</label>
          <input
            id="senha"
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? "Aguarde..." : criarConta ? "Criar conta" : "Entrar"}
        </button>

        {!criarConta && (
          <button type="button" onClick={esqueciSenha} disabled={enviandoReset}>
            {enviandoReset ? "Enviando..." : "Esqueci minha senha"}
          </button>
        )}

        <p role="status">{mensagem}</p>
      </form>

      <button type="button" onClick={() => setCriarConta(!criarConta)}>
        {criarConta ? "Já tenho conta" : "Ainda não tenho conta"}
      </button>
    </main>
  );
}