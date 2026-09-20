# Handoff — Spiral Ascension (state as of 2026-09-19)

This document records the repository state at handoff to a new development
environment. It is descriptive, not a roadmap. Verify anything marked *unverified*
before relying on it.

## Architecture

- **Frontend**: Vite + React (`frontend/`), deployed on Vercel from `main`.
  Gated by `AppAccessGate` / `useMembershipAccess` (Supabase session +
  `billing_subscriptions.status` in `active`/`trialing`).
- **Backend**: FastAPI (`backend/server.py`), deployed on Render from `main`
  (`render.yaml`). API base: `https://spiral-ascension-app.onrender.com/api`.
- **Database/Auth**: Supabase project `vcxmjboyngkpqdefblxq`. Frontend uses the
  publishable (anon) key; backend uses the service-role key (Render env).
- **Billing**: Stripe (checkout, portal, webhook → `billing_subscriptions`).
- Content: rows in the Supabase `practices` table override
  `frontend/src/data/practices.ts`. Fringe/Lore, Tile 5 and MoonSync
  `harmonicMonths.ts` are code-only.

See `DEPLOYMENT.md` and `ACCOUNT_DATA.md` for details.

## Merged into `main` on 2026-09-19 (merge commits, history preserved)

| PR | Scope |
|----|-------|
| #6 | Verify Supabase JWT for Vault/MoonSync endpoints; `x-moonsync-user` header no longer trusted for scoping; removed unauthenticated `POST /api/status`; footer on legal pages; Serpent Bearer copy |
| #7 | Account data export (`GET /api/account/export`) and account deletion (`DELETE /api/account`, confirmation required, cancels Stripe subs first). Billing ownership bound to `user_id` |
| #12 | Vault / Personal Writings: save no longer fails silently — editor stays open until insert succeeds, API errors surfaced, legacy-header compat |
| #14 | MoonSync events stored under UUID ids (prod `moonsync_events.id` is `uuid`; the previous `event_<ts>_<rand>` ids were rejected by Postgres so saves never persisted) |
| #11 | Vault mode toggle no longer snaps back to Spiral Notes when opened via `?mode=` |
| #9 | MoonSync: "Choose Your Action" wired to the 12/13-month toggle, phase labels, harmonic alignment copy |
| #10 | Vault schema hotfix migration scripts (`migrations/2026-09-16-vault-hotfix/`) — documentation of a migration that was **already applied to prod on 2026-09-16** |

Closed without merging (temporary Render preview shims): #13, #15.

## Test results at handoff

- Backend: `python -m pytest tests` → **85 passed** (run on `feat/billing-hardening`
  after merging `main` into it, i.e. a superset of `main`; Python 3.13,
  `fastapi==0.110.1 supabase stripe==15.0.1 pytest httpx uvicorn`).
- Frontend: `vite build` on `main` → success; `tsc --noEmit` → 0 errors.
- No end-to-end tests were run against production after the merges (credit
  constraints). Recommended smoke test after Render/Vercel finish deploying `main`:
  sign in → Vault save (both modes) → MoonSync create event → Account export.

## Database migrations — status

| Migration file | Status |
|----------------|--------|
| `supabase_vault_migration.sql`, `migrations/2026-09-16-vault-hotfix/` | Applied (prod has `vault_entries.type` and `spiral_notes`) — verified 2026-09-16 via read-only PostgREST probes |
| `supabase_billing_user_binding_migration.sql` (PR #7) | Applied (prod `billing_subscriptions.user_id` exists) — verified 2026-09-17 |
| `supabase_billing_webhook_events_migration.sql` (PR #8) | **NOT applied.** Prod returns 404 for `billing_webhook_events` (probed 2026-09-19) |

## Owner actions still required

1. **PR #8 — Billing hardening** (open, synced with `main`, tests pass).
   Order matters: **run `supabase_billing_webhook_events_migration.sql` in the
   Supabase SQL editor first, then merge #8.** The #8 webhook handler fails closed:
   without the table every Stripe webhook answers 503 (Stripe retries), so merging
   before the migration would stall subscription activation.
2. **PR #4 — mobile MoonSync icon sizing, CTA widths, em-dash removal on the entry
   page** (author: haroldson-systems, May 2026). Mergeable, but it changes visible
   copy, so left for the owner's decision.
3. Legacy `billing_subscriptions` rows with an email but no `user_id` need a
   backfill (the API answers 409 / `needsLinking` for them by design).
4. `feat/prismatic-breath-redesign` contains only a plan document; the Tile 5 /
   Prismatic Breath redesign (Ground · Balance · Release · Restore · Awaken) is
   paused pending the owner's structure.

## Known bugs and loose ends (not fixed)

- **MoonSync saved events are not shown in the UI**: `EventList` / `useEvents`
  exist but are never rendered. Events now persist (PR #14) but are invisible.
- `profiles(id, email, created_at, role)` exists in prod but is not defined in
  this repo and is written by no code here (trigger or manual) — *unverified*.
- Release audit items from 2026-09-15 (re-verify before acting): no MX/SPF for
  the sending domain; Vercel Hobby plan terms for commercial use.
- Staging account `thespiralascension+staging@gmail.com`
  (user `7be8def2-5c31-4acc-9c9e-325e1b365b2b`) exists in prod — do not delete
  without owner approval.
- Vercel: a branch-scoped `VITE_API_URL` env var was set for the
  `fix/moonsync-event-uuid` branch (pointed at a Render PR preview). Harmless
  once the branch is deleted; remove it from the Vercel project settings when
  convenient.

## Branches that can be deleted

Merged: `fix/auth-status-footer-serpent`, `feat/account-export-delete`,
`fix/vault-save-errors`, `fix/moonsync-event-uuid`, `fix/vault-mode-toggle`,
`fix/moonsync-harmonic-alignment`, `hotfix/vault-schema-migration`.

Keep until decided: `feat/billing-hardening` (#8), `fix/mobile-moonsync-and-copy`
(#4), `feat/prismatic-breath-redesign` (plan only).
