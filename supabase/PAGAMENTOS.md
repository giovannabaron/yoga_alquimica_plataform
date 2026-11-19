# Pagamentos Pix

## Pré-requisitos

- A tabela `public.assinaturas` deve existir com `user_id` único e `valida_ate` do tipo `timestamptz`.
- O frontend precisa ter `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurados como já usa o cliente Supabase.
- Os valores em `PRECO_MENSAL` e `PRECO_ANUAL` devem corresponder aos preços mostrados na página inicial.

## Configuração

Configure os segredos do projeto Supabase. Use o token de acesso do Mercado Pago e o segredo de assinatura de Webhooks da aplicação:

```powershell
supabase secrets set MP_ACCESS_TOKEN=<token-de-acesso> MP_WEBHOOK_SECRET=<segredo-do-webhook> PRECO_MENSAL=36.90 PRECO_ANUAL=369.00
```

Para testar pagamentos, crie uma conta compradora em **Contas de teste** no Mercado Pago e configure o e-mail dela como secret `MP_TEST_PAYER_EMAIL`. A Edge Function usa esse e-mail como pagador quando o secret está definido; sem ele, usa o e-mail da pessoa autenticada. Remova `MP_TEST_PAYER_EMAIL` ao trocar para credenciais de produção.

O Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às Edge Functions hospedadas. A chave de serviço é usada apenas pelo webhook e nunca deve ser colocada no frontend.

## Publicação

Com o schema existente de `assinaturas` já aplicado, publique a migration e as Edge Functions:

```powershell
supabase db push
supabase functions deploy criar-pix
supabase functions deploy webhook-mp
```

O arquivo `config.toml` desativa a verificação JWT do gateway somente em `webhook-mp`; a função verifica a assinatura HMAC do Mercado Pago antes de processar qualquer notificação. `criar-pix` continua exigindo uma sessão autenticada.

O endpoint de notificação é incluído em cada pagamento como `https://<projeto>.supabase.co/functions/v1/webhook-mp`. Confirme no painel do Mercado Pago que os Webhooks de pagamentos estão usando o mesmo segredo configurado em `MP_WEBHOOK_SECRET`.

Quando o Mercado Pago confirma um Pix como aprovado, o webhook confere status, método, moeda, valor e referência do plano. A migration registra o ID do pagamento e estende `assinaturas.valida_ate` em 30 ou 365 dias numa operação idempotente, sem duplicar o acesso em notificações repetidas.