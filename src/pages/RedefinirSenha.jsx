import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import "./Portal.css";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [linkValido, setLinkValido] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarLink() {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;

      if (data.session) {
        setLinkValido(true);
      } else {
        setMensagem("Este link não está válido ou expirou. Solicite novamente a redefinição da senha.");
      }
    }

    verificarLink();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (ativo && event === "PASSWORD_RECOVERY" && session) {
        setLinkValido(true);
        setMensagem("");
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setMensagem("Não foi possível salvar. O link pode ter expirado, tente pedir um novo.");
    } else {
      await supabase.auth.signOut();
      setMensagem("Senha alterada com sucesso! Redirecionando para o login...");
      setTimeout(() => navigate("/entrar", { replace: true }), 1500);
    }

    setCarregando(false);
  }

  return (
    <div className="portal-page">
      <SiteHeader />
      <main className="auth-main">
        <section className="auth-panel">
          <p className="portal-eyebrow">YÔGA ALQUÍMICA</p>
          <h1 className="portal-heading">Criar nova senha</h1>

          <form className="auth-form" onSubmit={salvar}>
            <div>
              <label htmlFor="senha">Nova senha (mínimo 6 caracteres)</label>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={!linkValido}
              />
            </div>

            <button className="portal-button" type="submit" disabled={carregando || !linkValido}>
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>

            <p className="auth-message" role="status">{mensagem}</p>
          </form>
        </section>
      </main>
    </div>
  );
}