import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setMensagem("Não foi possível salvar. O link pode ter expirado, tente pedir um novo.");
    } else {
      setMensagem("Senha alterada com sucesso! Redirecionando...");
      setTimeout(() => navigate("/aulas"), 2000);
    }

    setCarregando(false);
  }

  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Criar nova senha</h1>

      <form onSubmit={salvar}>
        <div>
          <label htmlFor="senha">Nova senha (mínimo 6 caracteres)</label>
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
          {carregando ? "Salvando..." : "Salvar nova senha"}
        </button>

        <p role="status">{mensagem}</p>
      </form>
    </main>
  );
}