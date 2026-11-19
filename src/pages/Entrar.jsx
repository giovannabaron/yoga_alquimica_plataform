import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import "./Portal.css";

export default function Entrar() {
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from ?? "/aulas";
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
        navigate(destino, { replace: true });
      } else {
        setMensagem(
          "Cadastro recebido. Confira seu e-mail, inclusive o spam, e clique no link de confirmação. Depois volte aqui e entre com seu e-mail e senha.",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setMensagem("E-mail ou senha incorretos.");
      } else {
        navigate(destino, { replace: true });
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
    <div className="portal-page">
      <SiteHeader />
      <main className="auth-main">
        <section className="auth-panel">
          <p className="portal-eyebrow">YOGA ALQUÍMICA</p>
          <h1 className="portal-heading">{criarConta ? "Criar conta" : "Entrar"}</h1>

          <form className="auth-form" onSubmit={enviar}>
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

            <button className="portal-button" type="submit" disabled={carregando}>
              {carregando ? "Aguarde..." : criarConta ? "Criar conta" : "Entrar"}
            </button>

            {!criarConta && (
              <button className="auth-secondary" type="button" onClick={esqueciSenha} disabled={enviandoReset}>
                {enviandoReset ? "Enviando..." : "Esqueci minha senha"}
              </button>
            )}

            <p className="auth-message" role="status">{mensagem}</p>
          </form>

          <button className="auth-secondary" type="button" onClick={() => setCriarConta(!criarConta)}>
            {criarConta ? "Já tenho conta" : "Ainda não tenho conta"}
          </button>
        </section>
      </main>
    </div>
  );
}