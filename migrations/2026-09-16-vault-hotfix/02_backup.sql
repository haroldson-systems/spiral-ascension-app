-- ============================================================================
-- Vault hotfix — 02 BACKUP (safe to run; creates copies only)
-- ============================================================================
-- Snapshot vault_entries before touching it. Kept until postflight passes.
create table if not exists public._backup_vault_entries_20260916 as
  table public.vault_entries with no data;
insert into public._backup_vault_entries_20260916 select * from public.vault_entries;

select count(*) as backed_up_rows from public._backup_vault_entries_20260916;
-- Also: Supabase Dashboard → Database → Backups → confirm a daily backup exists for today (Pro) or
-- take a manual `pg_dump` via the connection string before running 03.
