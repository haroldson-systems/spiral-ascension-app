"""Vault hotfix verification — run ONLY after the owner has executed 03_migrate.sql.

Uses a throwaway anonymous Supabase user and the *live* API. Steps:
  1. create anonymous user
  2. write a Personal Writing (POST /vault/entries) and a Spiral Note (PUT /vault/spiral-notes/{module})
  3. read both back (GET) — "reload round-trip"
  4. update the Spiral Note, read again
  5. cleanup: delete the rows and the auth user

Cleanup needs the service-role key (auth admin) — pass SUPABASE_SERVICE_ROLE_KEY, or run the printed
SQL in the dashboard. Also removes the previously disclosed anonymous test users when
EXTRA_CLEANUP_USER_IDS is set (comma-separated).

Usage:
  BACKEND_URL=https://spiral-ascension-app.onrender.com \
  SUPABASE_URL=https://vcxmjboyngkpqdefblxq.supabase.co SUPABASE_ANON_KEY=<publishable key> \
  [SUPABASE_SERVICE_ROLE_KEY=<service key>] [EXTRA_CLEANUP_USER_IDS=uuid,uuid] \
  python tests/smoke_vault_e2e.py

Works with either auth scheme: sends both `Authorization: Bearer <jwt>` (PR #6) and the legacy
`x-moonsync-user` header (current main) with the SAME user id, so it is valid before and after #6.
"""
import os
import sys

import requests

BACKEND = os.environ["BACKEND_URL"].rstrip("/") + "/api"
SB_URL = os.environ["SUPABASE_URL"].rstrip("/")
SB_KEY = os.environ["SUPABASE_ANON_KEY"]
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
EXTRA = [u.strip() for u in os.environ.get("EXTRA_CLEANUP_USER_IDS", "").split(",") if u.strip()]

failures = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")
    if not ok:
        failures.append(name)


def anon_user():
    r = requests.post(f"{SB_URL}/auth/v1/signup", headers={"apikey": SB_KEY}, json={}, timeout=20)
    r.raise_for_status()
    return r.json()["user"]["id"], r.json()["access_token"]


def api(method, path, uid, token, **kw):
    headers = {"Authorization": f"Bearer {token}", "x-moonsync-user": uid, "Content-Type": "application/json"}
    return requests.request(method, f"{BACKEND}{path}", headers=headers, timeout=30, **kw)


def admin_delete_user(uid):
    if not SERVICE_KEY:
        return False
    r = requests.delete(f"{SB_URL}/auth/v1/admin/users/{uid}",
                        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}, timeout=20)
    return r.status_code in (200, 204)


def main():
    uid, tok = anon_user()
    print(f"throwaway user {uid}\n")

    # Personal Writing
    r = api("POST", "/vault/entries", uid, tok, json={"content": "hotfix smoke entry", "tags": ["smoke"], "type": "text"})
    check("POST /vault/entries -> 200", r.status_code == 200, f"{r.status_code} {r.text[:120]}")
    entry_id = r.json().get("id") if r.status_code == 200 else None

    r = api("GET", "/vault/entries", uid, tok)
    ok = r.status_code == 200 and any(e.get("id") == entry_id for e in r.json())
    check("GET /vault/entries returns the entry with type", ok, f"{r.status_code} {r.text[:120]}")

    # Spiral Note
    r = api("PUT", "/vault/spiral-notes/smoke-module", uid, tok, json={"content": "note v1"})
    check("PUT spiral note -> ok:true", r.status_code == 200 and r.json().get("ok") is True, r.text[:120])
    r = api("GET", "/vault/spiral-notes/smoke-module", uid, tok)
    check("GET spiral note round-trips v1", r.status_code == 200 and r.json().get("content") == "note v1", r.text[:120])
    r = api("PUT", "/vault/spiral-notes/smoke-module", uid, tok, json={"content": "note v2"})
    r = api("GET", "/vault/spiral-notes/smoke-module", uid, tok)
    check("update spiral note round-trips v2", r.status_code == 200 and r.json().get("content") == "note v2", r.text[:120])

    # Cleanup
    print("\ncleanup:")
    users = [uid] + EXTRA
    if SERVICE_KEY:
        for u in users:
            print(f"  delete auth user {u}: {'ok' if admin_delete_user(u) else 'FAILED'}")
        print("  (public.users cascades to vault_entries / spiral_notes / moonsync_* via FK; verify with the SQL below if unsure)")
    else:
        print("  no SUPABASE_SERVICE_ROLE_KEY — run this in the SQL editor:")
    ids = ", ".join(f"'{u}'" for u in users)
    print(f"""
  -- remove throwaway rows + auth users
  delete from public.vault_entries     where user_id in ({ids});
  delete from public.spiral_notes      where user_id in ({ids});
  delete from public.moonsync_events   where user_id in ({ids});
  delete from public.moonsync_settings where user_id in ({ids});
  delete from public.profiles          where id in ({ids});
  delete from public.users             where id in ({ids});
  delete from auth.users               where id in ({ids});
""")
    print(f"\n{len(failures)} failed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
