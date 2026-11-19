import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SiteHeader from "../components/SiteHeader";
import "./Pix.css";

const PLANOS = {
  mensal: { nome: "Plano mensal", dias: 30 },
  anual: { nome: "Plano anual", dias: 365 },
};

async function consultarAssinatura(userId) {
  return supabase
    .from("assinaturas")
    .select("valida_ate")
    .eq("user_id", userId)
    .maybeSingle();
}

async function mensagemErroPix(error, data) {
  if (typeof data?.erro === "string") return data.erro;

  const response = error?.context;
  if (response instanceof Response) {
    const body = await response.clone().json().catch(() => null);
    if (typeof body?.erro === "string") return body.erro;
    if (response.status === 401) return "Sua sessão expirou. Entre novamente e tente gerar o Pix.";
    if (response.status === 404) return "A função de pagamento não foi encontrada. Peça para publicar criar-pix novamente.";
  }

  if (error?.name === "FunctionsFetchError") {
    return "Não foi possível conectar ao serviço de pagamento. Verifique a conexão e tente novamente.";
  }

  return "Não foi possível gerar o Pix. Confira a configuração do pagamento no Supabase e tente novamente.";
}

export default function Assinar() {
  const { plano } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [pix, setPix] = useState(null);
  const [validadeAnterior, setValidadeAnterior] = useState(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!PLANOS[plano]) {
      navigate("/", { replace: true });
      return;
    }

    let ativo = true;
    async function conferirSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ativo) return;
      if (!session) {
        navigate("/entrar", { replace: true, state: { from: `/assinar/${plano}` } });
        return;
      }
      setUserId(session.user.id);
      setVerificandoSessao(false);
    }

    conferirSessao();
    return () => { ativo = false; };
  }, [navigate, plano]);

  async function verificarAssinatura() {
    if (!userId) return;
    const { data, error: consultaErro } = await consultarAssinatura(userId);

    if (consultaErro) {
      setAviso("Não foi possível consultar a confirmação agora.");
      return;
    }

    const validadeAtual = data?.valida_ate ? new Date(data.valida_ate).getTime() : 0;
    if (validadeAtual > (validadeAnterior ?? 0)) {
      setConfirmado(true);
    }
  }

  useEffect(() => {
    if (!pix || !userId || confirmado) return;
    let ativo = true;
    const intervalo = window.setInterval(async () => {
      const { data, error } = await consultarAssinatura(userId);
      const validadeAtual = data?.valida_ate ? new Date(data.valida_ate).getTime() : 0;
      if (ativo && !error && validadeAtual > (validadeAnterior ?? 0)) {
        setConfirmado(true);
      }
    }, 5000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [pix, userId, confirmado, validadeAnterior]);

  async function gerarPix() {
    setGerandoPix(true);
    setErro("");
    setAviso("");
    const { data: assinaturaAtual, error: consultaErro } = await consultarAssinatura(userId);
    if (consultaErro) {
      setGerandoPix(false);
      setErro("Não foi possível verificar sua assinatura. Tente novamente.");
      return;
    }
    setValidadeAnterior(
      assinaturaAtual?.valida_ate ? new Date(assinaturaAtual.valida_ate).getTime() : 0,
    );

    const { data, error } = await supabase.functions.invoke("criar-pix", {
      body: { plano },
    });
    setGerandoPix(false);

    if (error || data?.erro || !data?.qr_code || !data?.qr_code_base64) {
      setErro(await mensagemErroPix(error, data));
      return;
    }
    setPix(data);
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(pix.qr_code);
      setAviso("Código Pix copiado.");
    } catch {
      setAviso("Não foi possível copiar automaticamente. Selecione e copie o código.");
    }
  }

  const dadosPlano = PLANOS[plano];
  if (!dadosPlano) return null;

  return (
    <main className="pix-page">
      <SiteHeader />

      <section className="pix-layout" aria-labelledby="pix-title">
        <div className="pix-intro">
          <p className="pix-eyebrow">ASSINATURA POR PIX</p>
          <h1 id="pix-title">{confirmado ? "A prática é sua." : "Seu próximo passo."}</h1>
          <p>
            {confirmado
              ? "Pagamento confirmado. Seu acesso às aulas já está liberado."
              : "Gere o Pix e conclua o pagamento no aplicativo do seu banco."}
          </p>
          <div className="pix-plan-summary">
            <span>{dadosPlano.nome}</span>
            <strong>{dadosPlano.dias} dias de acesso</strong>
          </div>
        </div>

        <div className="pix-workspace">
          {verificandoSessao ? (
            <p className="pix-status" role="status">Verificando sua conta...</p>
          ) : confirmado ? (
            <div className="pix-success" role="status">
              <span className="pix-success-mark" aria-hidden="true">✓</span>
              <h2>Pagamento aprovado</h2>
              <p>Seu plano de {dadosPlano.dias} dias está ativo.</p>
              <Link className="pix-action" to="/aulas">Acessar as aulas</Link>
            </div>
          ) : pix ? (
            <div className="pix-payment">
              <div className="pix-amount">
                <span>Valor do Pix</span>
                <strong>
                  {Number(pix.valor).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
              <img
                className="pix-qr"
                src={`data:image/png;base64,${pix.qr_code_base64}`}
                alt="QR Code Pix para pagamento"
              />
              <label className="pix-code-label" htmlFor="pix-code">Pix copia e cola</label>
              <textarea id="pix-code" className="pix-code" readOnly value={pix.qr_code} rows={3} />
              <button className="pix-action" type="button" onClick={copiarCodigo}>
                Copiar código Pix
              </button>
              <p className="pix-wait" role="status">
                Aguardando confirmação do pagamento. Esta tela atualiza automaticamente.
              </p>
              <button className="pix-refresh" type="button" onClick={verificarAssinatura}>
                Já paguei · verificar agora
              </button>
              {aviso && <p className="pix-notice" role="status">{aviso}</p>}
            </div>
          ) : (
            <div className="pix-start">
              <p>O QR Code é gerado para sua conta e tem o valor do plano selecionado.</p>
              <button className="pix-action" type="button" onClick={gerarPix} disabled={gerandoPix}>
                {gerandoPix ? "Gerando Pix..." : "Gerar QR Code Pix"}
              </button>
              {erro && <p className="pix-error" role="alert">{erro}</p>}
            </div>
          )}
        </div>
      </section>
      <footer className="pix-footer">Yoga Alquímica · Pagamento processado pelo Mercado Pago</footer>
    </main>
  );
}