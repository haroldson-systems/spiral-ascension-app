-- ============================================================================
-- Vault hotfix — 04 POSTFLIGHT (read-only). All expectations must hold.
-- ============================================================================
-- type column exists with default 'text'
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'vault_entries' and column_name = 'type';

-- no row lost, no null type
select (select count(*) from public.vault_entries)                       as rows_now,
       (select count(*) from public._backup_vault_entries_20260916)      as rows_backup,
       (select count(*) from public.vault_entries where type is null)    as null_types;   -- expect 0

-- spiral_notes exists, empty, with unique constraint + FK
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.spiral_notes'::regclass;
select count(*) as spiral_notes_rows from public.spiral_notes;

-- RLS enabled + policies present on both
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('vault_entries', 'spiral_notes');
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('vault_entries', 'spiral_notes') order by 1, 2;

-- Then run: python tests/smoke_vault_e2e.py (see README) against the live API.
-- After the smoke test passes and 7 days have gone by without incident:
--   drop table public._backup_vault_entries_20260916;
