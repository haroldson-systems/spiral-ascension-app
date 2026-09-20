# Vault hotfix — missing `vault_entries.type` + missing `spiral_notes`

**Why:** `supabase_vault_migration.sql` was never applied in production, and it is *not* safe to run as-is:
`CREATE TABLE IF NOT EXISTS` skips the existing `vault_entries` (so `type` is never added) and its unconditional
`CREATE POLICY` fails because a policy already exists. Result today: `GET/POST /api/vault/entries` → 500 and Spiral Notes never persist.

**Run order (Supabase SQL Editor, owner only):**

| Step | File | Effect | Paste output into PR? |
|---|---|---|---|
| 1 | `01_preflight.sql` | read-only inventory: tables, columns, row counts, policy names, FK, recoverable-data search | **yes** |
| 2 | `02_backup.sql` | copies `vault_entries` to `_backup_vault_entries_20260916` | yes (row count) |
| 3 | `03_migrate.sql` | single transaction, idempotent: add `type`, create `spiral_notes`, enable RLS, create policies only if absent, reload PostgREST schema | — |
| 4 | `04_postflight.sql` | verifies column, row counts vs backup, constraints, RLS, policies | **yes** |
| 5 | `tests/smoke_vault_e2e.py` | throwaway-user write/read/update round-trip through the live API + cleanup SQL | **yes** |
| — | `05_rollback.sql` | only if 4 or 5 fail | — |

No application code change is required; the backend already writes `type` and uses `spiral_notes`.

**Recoverable Spiral Notes data:** `spiral_notes` never existed, and the backend swallowed the PostgREST error and
returned `{"ok": false}` — so no note ever reached the database. The frontend keeps a localStorage copy per browser;
that is the only place existing notes may survive (user-side, not restorable centrally). `01_preflight.sql` §8 double-checks
for any look-alike columns anyway.

**Test users to remove after step 5:** the script's own throwaway user, plus the previously disclosed anonymous
probe user `4617789d-2dd1-4788-aa9f-0aaef255a415` (pass it via `EXTRA_CLEANUP_USER_IDS`).
