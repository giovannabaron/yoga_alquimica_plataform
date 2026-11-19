create table if not exists public.pagamentos_mp (
  payment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plano text not null check (plano in ('mensal', 'anual')),
  confirmado_em timestamptz not null default now()
);

alter table public.pagamentos_mp enable row level security;
revoke all on table public.pagamentos_mp from anon, authenticated;
grant all on table public.pagamentos_mp to service_role;

create or replace function public.confirmar_pagamento_pix(
  p_payment_id text,
  p_user_id uuid,
  p_plano text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  dias integer;
  linhas_inseridas integer;
  pagamento_existente public.pagamentos_mp%rowtype;
  nova_validade timestamptz;
begin
  if p_plano not in ('mensal', 'anual') then
    raise exception 'Plano inválido';
  end if;

  dias := case p_plano when 'mensal' then 30 else 365 end;

  insert into public.pagamentos_mp (payment_id, user_id, plano)
  values (p_payment_id, p_user_id, p_plano)
  on conflict (payment_id) do nothing;

  get diagnostics linhas_inseridas = row_count;
  if linhas_inseridas = 0 then
    select * into pagamento_existente
    from public.pagamentos_mp
    where payment_id = p_payment_id;

    if pagamento_existente.user_id <> p_user_id or pagamento_existente.plano <> p_plano then
      raise exception 'Pagamento já associado a outra assinatura';
    end if;

    select valida_ate into nova_validade
    from public.assinaturas
    where user_id = p_user_id;
    return nova_validade;
  end if;

  insert into public.assinaturas (user_id, valida_ate)
  values (p_user_id, now() + make_interval(days => dias))
  on conflict (user_id) do update
  set valida_ate = greatest(coalesce(public.assinaturas.valida_ate, now()), now())
    + make_interval(days => dias)
  returning valida_ate into nova_validade;

  return nova_validade;
end;
$$;

revoke all on function public.confirmar_pagamento_pix(text, uuid, text) from public, anon, authenticated;
grant execute on function public.confirmar_pagamento_pix(text, uuid, text) to service_role;