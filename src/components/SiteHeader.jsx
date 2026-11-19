import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./SiteHeader.css";

export default function SiteHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncSession(session) {
      if (!active) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      if (active) setIsAdmin(Boolean(profile?.is_admin));
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

  async function sair() {
    await supabase.auth.signOut();
    navigate("/");
  }

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
              <Link className="site-nav-link" to="/aulas">Minha área</Link>
              {isAdmin && <Link className="site-nav-link" to="/admin">Painel admin</Link>}
              <button className="site-nav-button" type="button" onClick={sair}>Sair</button>
            </>
          ) : (
            <Link className="site-nav-login" to="/entrar">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}