# Account data: export & deletion

Implements the "export or delete tools available in the app" promised by the Privacy Policy.
UI: `/account` (Footer → Account, Navigation → Account). API: `GET /api/account/export`, `DELETE /api/account`.
Both act only on the user identity verified from the Supabase access token.

## Production schema inventory vs. code (verified 2026-09-16 via PostgREST against the live project)

| Table (public) | Columns found in prod | Owner key | Exported | Deleted |
|---|---|---|---|---|
| `users` | `id` | `id = auth uid` | (id is in `account`) | ✅ step 4 |
| `profiles` | `id, email, created_at, role` — **not referenced anywhere in the repo** (likely an auth trigger) | `id = auth uid` | ✅ `profile` | ✅ step 4 |
| `moonsync_settings` | `user_id, cycle_mode, timezone, anchor_date, updated_at` | `user_id` | ✅ | ✅ step 3 |
| `moonsync_events` | `id, user_id, title, description, event_type, associated_phase, event_at, created_at` | `user_id` | ✅ | ✅ step 3 |
| `vault_entries` | `id, user_id, title, content, tags, created_at, updated_at` (`type` arrives with the Vault hotfix) | `user_id` | ✅ | ✅ step 3 |
| `spiral_notes` | does not exist yet (Vault hotfix creates it) | `user_id` | ✅ (empty until hotfix) | ✅ step 3 |
| `billing_subscriptions` | `id, stripe_subscription_id, stripe_customer_id, customer_email, stripe_price_id, status, cancel_at_period_end, trial_end, current_period_end, checkout_session_id, metadata, updated_at` (+ `user_id` via binding migration) | `user_id` | ✅ status view | ♻️ retained, email scrubbed |
| `practices`, `practice_variants`, `spiral_modules` | content tables | — none | n/a | n/a |
| `auth.users` (Supabase Auth) | email, password hash, sessions | id | ✅ `account` | ✅ step 5 |

Export queries `select *` on every user-owned table (not a hand-picked column list), so any column added later is included automatically; missing tables yield `[]` instead of an error.

## Ownership of billing rows — `user_id`, not email
Email can change or be reused, so it is never used to decide what belongs to the caller.
- **New checkouts** (`POST /api/billing/checkout-session` with the buyer's session token) set Stripe `client_reference_id` and `subscription_data.metadata.user_id`; the webhook writes `billing_subscriptions.user_id` from them.
- **Existing rows** are back-filled once by `supabase_billing_user_binding_migration.sql` (exact, case-insensitive match against a *confirmed* `auth.users.email`; `auth.users.email` is unique so the match is unambiguous). Rows with no match stay unbound and are listed for manual linking.
- **Deletion refuses (409)** while an *active* subscription matches the caller's email but has no `user_id` — so we can neither cancel a stranger's subscription nor delete data while an unlinked subscription keeps charging.
- Export lists only bound subscriptions and reports the count of unbound email matches.

## Export (`GET /api/account/export`)
One JSON download (`spiral-ascension-export-YYYYMMDD.json`, `exportVersion: 2`) with the sections `account`, `profile`, `vault.entries`, `vault.spiralNotes`, `moonsync.settings`, `moonsync.events`, `billing.subscriptions` (status/dates only — no Stripe IDs) and `billing.unlinkedSubscriptionsMatchingEmail`.
Not included: Stripe payment details (card, invoices) — reachable via the billing portal.

## Deletion (`DELETE /api/account`, body `{"confirmation": "DELETE"}`)
UI requires an acknowledgement checkbox **and** typing `DELETE`; the API rejects anything else (400).

Order of operations — every step is idempotent, so a failed request is retried by simply calling again with the same session:

| Step | Action | On failure | Why this order |
|---|---|---|---|
| 0 | refuse if an unbound active subscription matches the email | 409, nothing done | ownership guard |
| 1 | cancel every active Stripe subscription **bound to the user** | 502 with `n of m cancelled`, nothing deleted; already-cancelled subs are treated as done on retry | never leave a charging subscription behind data deletion |
| 2 | anonymize retained `billing_subscriptions` rows (`customer_email → NULL`, `metadata.account_deleted_at`) and **verify** the write | 500, nothing deleted | success must never be reported with PII retained |
| 3 | delete `vault_entries`, `spiral_notes`, `moonsync_events`, `moonsync_settings` | 500 "try again" (subs already cancelled) | children before parents |
| 4 | delete `profiles`, `users` | 500 "try again" | parents |
| 5 | delete the Supabase auth user | 500 "try again" | login goes last so the user can retry |
| 6 | client clears membership cache, signs out, returns to `/` | — | |

Invariants (covered by tests): no data is removed before all subscriptions are cancelled; a response is `200` only when steps 1–5 all succeeded; the auth user is never removed before the data; a retry after any interruption reaches the same end state.

## What is retained and why
| Data | Retained? | Why |
|---|---|---|
| `billing_subscriptions` rows (Stripe subscription/customer ids, status, period dates) | Yes, **email scrubbed** | Payment/tax/chargeback records tied to Stripe objects; no free-text or profile PII after scrubbing |
| Stripe customer, invoices, charges | Yes (in Stripe) | Legal/financial record keeping; Stripe is the processor of record. Owner may delete the customer in the Stripe Dashboard |
| Server logs | Render retention window | Debugging; log lines carry only the first 8 chars of the user id and row counts |
| Everything else (Vault, notes, MoonSync, profile, auth account) | **No** | Deleted in the request |

## Migrations required before release
1. `migrations/2026-09-16-vault-hotfix/` (PR #10) — `vault_entries.type`, `spiral_notes`.
2. `supabase_billing_user_binding_migration.sql` (this PR) — `billing_subscriptions.user_id` + one-time backfill.

## Real-account verification before merge (owner + Viktor)
Throwaway account with a **Stripe test-mode** or trial subscription: export → inspect JSON against the inventory above → delete → confirm Stripe shows the subscription cancelled, all rows gone, auth user gone, billing row email `NULL`.
