-- ============================================================================
-- Vault hotfix — 05 ROLLBACK (only if postflight fails). Reverses 03 exactly.
-- ============================================================================
begin;
-- spiral_notes was created by 03 and had no prior data → safe to drop
drop table if exists public.spiral_notes;

-- remove the added column (existing rows keep all other data). If rows were already
-- written with a non-default type after the migration, that information is lost — acceptable
-- because the app treats a missing type as 'text'.
alter table public.vault_entries drop column if exists type;

-- policies created by 03 (only if they did not exist before — check 01 preflight output)
-- drop policy if exists "Users can manage own vault_entries" on public.vault_entries;

notify pgrst, 'reload schema';
commit;

-- Full restore of vault_entries content if ever needed:
--   truncate public.vault_entries; insert into public.vault_entries select * from public._backup_vault_entries_20260916;
