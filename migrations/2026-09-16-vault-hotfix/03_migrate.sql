-- ============================================================================
-- Vault hotfix — 03 MIGRATE (idempotent; safe to re-run). Wrapped in a transaction.
--
-- Fixes: (a) vault_entries missing `type` column → /api/vault/entries 500s
--        (b) spiral_notes table missing → Spiral Notes never persist
-- Does NOT drop or rewrite any existing row. Existing RLS policies are left in place;
-- policies are created only when a policy with that name is absent.
-- ============================================================================
begin;

-- (a) add the missing column without touching existing rows
alter table public.vault_entries
  add column if not exists type text default 'text';

-- backfill nulls only (new column defaults handle future rows)
update public.vault_entries set type = 'text' where type is null;

-- (b) spiral_notes: one row per user per module
create table if not exists public.spiral_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  module_id text not null,
  content text default '',
  updated_at timestamptz default now(),
  unique (user_id, module_id)
);

-- (c) RLS on (idempotent)
alter table public.vault_entries enable row level security;
alter table public.spiral_notes  enable row level security;

-- (d) policies, created only if missing (CREATE POLICY has no IF NOT EXISTS)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = 'vault_entries' and policyname = 'Users can manage own vault_entries') then
    create policy "Users can manage own vault_entries"
      on public.vault_entries for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = 'spiral_notes' and policyname = 'Users can manage own spiral_notes') then
    create policy "Users can manage own spiral_notes"
      on public.spiral_notes for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- (e) make PostgREST pick up the new column/table immediately
notify pgrst, 'reload schema';

commit;
