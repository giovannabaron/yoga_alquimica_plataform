import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "Método não permitido" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const plano = body?.plano;
    if (plano !== "mensal" && plano !== "anual") {
      return json({ erro: "Plano inválido" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) return json({ erro: "Supabase não configurado" }, 500);

    const supa = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: authError } = await supa.auth.getUser();
    if (authError || !user?.email) return json({ erro: "Não autenticado" }, 401);

    const preco = Number(Deno.env.get(plano === "mensal" ? "PRECO_MENSAL" : "PRECO_ANUAL"));
    if (!(preco > 0)) return json({ erro: "Preço não configurado" }, 500);

    const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) return json({ erro: "Mercado Pago não configurado" }, 500);
    const payerEmail = Deno.env.get("MP_TEST_PAYER_EMAIL")?.trim() || user.email;

    const r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: preco,
        description: `Assinatura ${plano} - Yoga Alquímica`,
        payment_method_id: "pix",
        payer: { email: payerEmail },
        external_reference: `${user.id}:${plano}`,
        notification_url: `${supabaseUrl}/functions/v1/webhook-mp`,
      }),
    });
    const payment = await r.json();
    const transactionData = payment?.point_of_interaction?.transaction_data;
    if (!r.ok || !transactionData?.qr_code || !transactionData?.qr_code_base64) {
      const causes = Array.isArray(payment?.cause) ? payment.cause.slice(0, 3) : [];
      const detalhes = causes
        .map((cause: { code?: string | number; description?: string }) => {
          const code = cause.code == null ? "" : String(cause.code);
          const description = typeof cause.description === "string"
            ? cause.description.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-mail]")
            : "";
          return [code, description].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ")
        .slice(0, 240);
      console.error("Mercado Pago recusou a criação do Pix", {
        status: r.status,
        error: payment?.error,
        causas: causes.map((cause: { code?: string | number }) => cause.code).filter(Boolean),
      });
      return json({
        erro: `Mercado Pago recusou a solicitação (HTTP ${r.status}${detalhes ? `: ${detalhes}` : ""}).`,
      }, 502);
    }

    return json({
      valor: preco,
      qr_code: transactionData.qr_code,
      qr_code_base64: transactionData.qr_code_base64,
    });
  } catch (error) {
    console.error(error);
    return json({ erro: "Erro interno" }, 500);
  }
});