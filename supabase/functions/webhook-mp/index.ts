import { createClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("método não permitido", { status: 405 });

  const url = new URL(req.url);
  const dataId = (url.searchParams.get("data.id") ?? "").toLowerCase();
  const requestId = req.headers.get("x-request-id") ?? "";
  const signatureParts = Object.fromEntries(
    (req.headers.get("x-signature") ?? "")
      .split(",")
      .map((part) => part.trim().split(/=(.*)/s).slice(0, 2)),
  );
  const timestamp = signatureParts.ts;
  const signature = signatureParts.v1;
  if (!dataId || !timestamp || !signature) {
    return new Response("sem assinatura", { status: 401 });
  }

  const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!webhookSecret) return new Response("webhook não configurado", { status: 500 });
  const expected = await hmacHex(webhookSecret, `id:${dataId};request-id:${requestId};ts:${timestamp};`);
  if (!iguais(expected, signature)) return new Response("assinatura inválida", { status: 401 });

  if (url.searchParams.get("type") !== "payment") return new Response("ok");

  const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!accessToken || !supabaseUrl || !serviceRoleKey) {
    return new Response("serviço não configurado", { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return new Response("falha ao consultar", { status: 500 });

    const payment = await response.json();
    if (payment?.status !== "approved") return new Response("ok");

    const reference = String(payment.external_reference ?? "").split(":");
    const [userId, plano, ...extra] = reference;
    if (extra.length || !userId || (plano !== "mensal" && plano !== "anual")) {
      return new Response("referência inválida", { status: 400 });
    }
    if (payment.payment_method_id !== "pix" || payment.currency_id !== "BRL") {
      return new Response("pagamento inválido", { status: 400 });
    }

    const preco = Number(Deno.env.get(plano === "mensal" ? "PRECO_MENSAL" : "PRECO_ANUAL"));
    if (!(preco > 0) || Math.round(Number(payment.transaction_amount) * 100) !== Math.round(preco * 100)) {
      return new Response("valor inválido", { status: 400 });
    }

    const supa = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supa.rpc("confirmar_pagamento_pix", {
      p_payment_id: dataId,
      p_user_id: userId,
      p_plano: plano,
    });
    if (error) {
      console.error("Falha ao confirmar pagamento:", error.message);
      return new Response("falha ao confirmar", { status: 500 });
    }

    return new Response("ok");
  } catch (error) {
    console.error(error);
    return new Response("erro interno", { status: 500 });
  }
});