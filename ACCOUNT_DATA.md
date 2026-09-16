# Account data: export & deletion

Implements the "export or delete tools available in the app" promised by the Privacy Policy.
UI: `/account` (Footer → Account, Navigation → Account). API: `GET /api/account/export`, `DELETE /api/account`.
Both act only on the user identity verified from the Supabase access token.

## Export (`GET /api/account/export`)

One JSON download (`spiral-ascension-export-YYYYMMDD.json`):

| Section | Contents |
|---|---|
| `account` | auth user id, email, created date, anonymous flag |
| `vault.entries` | Personal Writings (`vault_entries`: content, tags, type, created_at) |
| `vault.spiralNotes` | Spiral reflection notes per module (`spiral_notes`) |
| `moonsync.settings` | cycle mode, timezone, anchor date |
| `moonsync.events` | all MoonSync events |
| `billing.subscriptions` | subscription status, trial/period end, cancel flag (matched by account email) |

Not included: Stripe payment details (card, invoices) — those live in Stripe and are reachable via the billing portal.

## Deletion (`DELETE /api/account`, body `{"confirmation": "DELETE"}`)

UI requires: an acknowledgement checkbox **and** typing `DELETE`. The API rejects any other confirmation (400).

Order of operations (fail-safe: billing first, so a failure never leaves a paying account without a login):

1. **Cancel active Stripe subscriptions immediately** (statuses trialing/active/past_due/unpaid/incomplete/paused, matched via `billing_subscriptions.customer_email`). If Stripe is unreachable or not configured while an active subscription exists → **abort, nothing deleted** (502/503).
2. Delete user-owned rows: `vault_entries`, `spiral_notes`, `moonsync_events`, `moonsync_settings`.
3. Anonymize `billing_subscriptions` rows: `customer_email → NULL`, `metadata.account_deleted_at` set.
4. Delete `public.users` row.
5. Delete the Supabase **auth** user (`auth.admin.delete_user`) — removes email, password hash and all sessions.
6. Client signs out and returns to the entry page.

A partial failure after step 1 returns a 500 with a message that tells the user to contact support; the server log records which step failed (user id prefix only, no content).

## What is retained and why

| Data | Retained? | Why |
|---|---|---|
| `billing_subscriptions` rows (Stripe subscription/customer ids, status, period dates) | Yes, **email scrubbed** | Payment / tax / chargeback records tied to Stripe objects; contain no free-text or profile PII after scrubbing |
| Stripe customer, invoices, charges | Yes (in Stripe) | Legal/financial record keeping; Stripe is the processor of record. The customer's email remains in Stripe unless the owner deletes the customer in the Stripe Dashboard |
| Server logs | Short-term (Render log retention) | Operational debugging; log lines carry only the first 8 chars of the user id and row counts |
| Everything else (Vault, notes, MoonSync, auth account) | **No** | Deleted in the request |

No database migration is required: deletion uses existing tables and columns.
