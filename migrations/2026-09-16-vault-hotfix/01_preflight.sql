-- ============================================================================
-- Vault hotfix — 01 PREFLIGHT (read-only). Run in Supabase SQL Editor and paste
-- the results into the PR before anything else is executed.
-- ============================================================================

-- 1. Which of the tables involved exist?
select table_name,
       (select count(*) from information_schema.columns c
         where c.table_schema = t.table_schema and c.table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('users', 'vault_entries', 'spiral_notes', 'moonsync_settings', 'moonsync_events', 'billing_subscriptions')
order by table_name;

-- 2. Current columns of vault_entries (expect: no `type` column yet)
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'vault_entries'
order by ordinal_position;

-- 3. Does the `type` column already exist? (expect 0 rows)
select 1 as type_column_exists
from information_schema.columns
where table_schema = 'public' and table_name = 'vault_entries' and column_name = 'type';

-- 4. Row counts (service role bypasses RLS in the SQL editor)
select 'vault_entries' as t, count(*) from public.vault_entries
union all select 'users', count(*) from public.users
union all select 'moonsync_settings', count(*) from public.moonsync_settings
union all select 'moonsync_events', count(*) from public.moonsync_events;

-- 5. Existing RLS policies on the two tables (expect vault_entries policies present, spiral_notes none)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('vault_entries', 'spiral_notes')
order by tablename, policyname;

-- 6. RLS enabled flags
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('vault_entries', 'spiral_notes');

-- 7. Foreign keys on vault_entries (expect user_id -> public.users(id) ON DELETE CASCADE)
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.vault_entries'::regclass;

-- 8. Is there any recoverable Spiral Notes data anywhere? (spiral_notes never existed → expect none)
--    a) any table/column in public that looks like a note store
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (column_name ilike '%module%' or column_name ilike '%note%')
order by table_name, column_name;
--    b) vault_entries rows that might have been used as note fallbacks (title present or tag 'spiral-note')
select count(*) as vault_rows_with_title from public.vault_entries where title is not null;
select count(*) as vault_rows_tagged_note from public.vault_entries where tags ? 'spiral-note' or tags ? 'note';
-- NOTE: the frontend also stores Spiral Notes in browser localStorage (SpiralNotesView / LessonNoteBox);
--       that data is only recoverable from the user's own browser, not from the database.
