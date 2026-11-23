import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./SiteHeader.css";

export default function SiteHeader() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncSession(session) {
      if (!active) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        setNomeUsuario("");
        setEmailUsuario("");
        setMenuAberto(false);
        return;
      }

      const usuario = session.user;
      const nomeMetadata = usuario.user_metadata?.nome?.trim();
      const nomeEmail = usuario.email?.split("@")[0]?.trim() || "Usuário";

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, nome")
        .eq("id", usuario.id)
        .maybeSingle();

      if (!active) return;
      setIsAdmin(Boolean(profile?.is_admin));
      setEmailUsuario(usuario.email || "");

      const nomeCompleto = profile?.nome?.trim()
        || usuario.user_metadata?.nome_completo?.trim()
        || nomeMetadata
        || nomeEmail;
      setNomeUsuario(nomeCompleto.split(/\s+/)[0]);
    }

    supabase.auth.getSession().then(({ data }) => syncSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    }

    function fecharComEscape(event) {
      if (event.key === "Escape") setMenuAberto(false);
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  async function sair() {
    setMenuAberto(false);
    await supabase.auth.signOut();
    navigate("/");
  }

  const inicial = nomeUsuario ? nomeUsuario.charAt(0).toLocaleUpperCase("pt-BR") : "U";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" to="/" aria-label="Yoga Alquímica, início">
          <span className="site-brand-mark" aria-hidden="true">Y</span>
          <span>Yoga Alquímica</span>
        </Link>
        <nav className="site-nav" aria-label="Navegação principal">
          <Link className="site-nav-link" to="/#plans-title">Planos</Link>
          {user ? (
            <>
              {isAdmin && <Link className="site-nav-link" to="/admin">Painel admin</Link>}
              <div
                className="site-user-menu"
                ref={menuRef}
                onMouseEnter={() => setMenuAberto(true)}
              >
                <button
                  className="site-user"
                  type="button"
                  aria-expanded={menuAberto}
                  aria-haspopup="menu"
                  aria-label={`Abrir menu de ${nomeUsuario}`}
                  onClick={() => setMenuAberto(true)}
                >
                  <span className="site-user-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img">
                      <path d="M12 12a4.25 4.25 0 1 0 0-8.5A4.25 4.25 0 0 0 12 12Zm-7.25 8.5c.55-3.75 3.45-6.25 7.25-6.25s6.7 2.5 7.25 6.25H4.75Z" />
                    </svg>
                  </span>
                </button>

                {menuAberto && (
                  <div className="site-user-dropdown" role="menu">
                    <div className="site-user-summary">
                      <span className="site-user-summary-avatar" aria-hidden="true">{inicial}</span>
                      <div>
                        <strong>{nomeUsuario}</strong>
                        <span>{emailUsuario}</span>
                      </div>
                    </div>
                    <Link role="menuitem" to="/aulas" onClick={() => setMenuAberto(false)}>
                      <span className="site-menu-icon" aria-hidden="true">◉</span>
                      <span>
                        <strong>Minhas aulas</strong>
                        <small>Continuar praticando</small>
                      </span>
                    </Link>
                    <Link role="menuitem" to="/assinar/mensal" onClick={() => setMenuAberto(false)}>
                      <span className="site-menu-icon" aria-hidden="true">↻</span>
                      <span>
                        <strong>Renovar assinatura</strong>
                        <small>Ver planos e renovar</small>
                      </span>
                    </Link>
                    {isAdmin && (
                      <Link role="menuitem" to="/admin" onClick={() => setMenuAberto(false)}>
                        <span className="site-menu-icon" aria-hidden="true">◆</span>
                        <span>
                          <strong>Painel administrativo</strong>
                          <small>Gerenciar plataforma</small>
                        </span>
                      </Link>
                    )}
                    <button role="menuitem" type="button" onClick={sair}>
                      <span className="site-menu-icon" aria-hidden="true">↪</span>
                      <span>
                        <strong>Sair da conta</strong>
                        <small>Encerrar sessão</small>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link className="site-nav-login" to="/entrar">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}