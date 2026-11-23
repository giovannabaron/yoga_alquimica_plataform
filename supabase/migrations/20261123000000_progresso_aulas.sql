create table if not exists public.progresso_aulas (
  user_id uuid not null references auth.users (id) on delete cascade,
  aula_id bigint not null references public.aulas (id) on delete cascade,
  concluida_em timestamptz,
  segundos_assistidos integer not null default 0,
  ultimo_visto_em timestamptz,
  primary key (user_id, aula_id)
);

alter table public.progresso_aulas enable row level security;

create policy "Usuários podem ver seu próprio progresso"
  on public.progresso_aulas
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários podem marcar seu próprio progresso"
  on public.progresso_aulas
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seu próprio progresso"
  on public.progresso_aulas
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários podem remover seu próprio progresso"
  on public.progresso_aulas
  for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists progresso_aulas_ultimo_visto_idx
  on public.progresso_aulas (user_id, ultimo_visto_em desc);
