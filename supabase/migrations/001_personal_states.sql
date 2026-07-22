create extension if not exists pgcrypto;

create table if not exists public.personal_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('brief', 'event', 'item')),
  entity_id text not null,
  state text not null check (state in ('seen', 'kept', 'going', 'went')),
  active boolean not null default true,
  metadata jsonb,
  client_mutation_id uuid not null,
  client_changed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id, state),
  unique (user_id, client_mutation_id)
);

create index if not exists personal_states_user_active_idx
  on public.personal_states (user_id, active, state);

alter table public.personal_states enable row level security;

create policy "personal states are readable by their owner"
  on public.personal_states for select
  using ((select auth.uid()) = user_id);

create policy "personal states are insertable by their owner"
  on public.personal_states for insert
  with check ((select auth.uid()) = user_id);

create policy "personal states are updatable by their owner"
  on public.personal_states for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "personal states are deletable by their owner"
  on public.personal_states for delete
  using ((select auth.uid()) = user_id);

revoke all on table public.personal_states from anon;
grant select, insert, update, delete on table public.personal_states to authenticated;

comment on table public.personal_states is
  'Private per-account marks. Public research content remains in the data repositories.';
