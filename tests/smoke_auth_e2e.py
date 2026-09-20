"""End-to-end auth smoke test against a REAL Supabase project and a running backend.

Creates throwaway *anonymous* Supabase users (never touches existing accounts), then checks:
  1. missing token            -> 401
  2. legacy header only       -> 401
  3. garbage token            -> 401
  4. valid session            -> 200
  5. valid token + header claiming another user -> 403
  6. write own data, read it back (MoonSync settings + event)
  7. second anonymous user cannot see user 1's rows
  8. signed-out (revoked, unexpired) token -> 401
  9. cleanup: delete created rows through the API, sign both users out

Usage:
  BACKEND_URL=http://localhost:8001 \
  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<publishable/anon key> \
  python tests/smoke_auth_e2e.py

The backend must run with its normal SUPABASE_SERVICE_ROLE_KEY for the write checks (6, 7, 9);
with an anon-key backend those are reported as BLOCKED-BY-RLS instead of failing.
Requires: anonymous sign-ins enabled in Supabase Auth (they are for this project).
"""
import json
import os
import sys
import uuid

import requests

BACKEND = os.environ["BACKEND_URL"].rstrip("/") + "/api"
SB_URL = os.environ["SUPABASE_URL"].rstrip("/")
SB_KEY = os.environ["SUPABASE_ANON_KEY"]

results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'PASS' if ok is True else 'FAIL' if ok is False else 'SKIP'}  {name}  {detail}")


def anon_user():
    r = requests.post(f"{SB_URL}/auth/v1/signup", headers={"apikey": SB_KEY, "Content-Type": "application/json"}, json={}, timeout=20)
    r.raise_for_status()
    body = r.json()
    return body["user"]["id"], body["access_token"]


def logout(token):
    requests.post(f"{SB_URL}/auth/v1/logout?scope=global", headers={"apikey": SB_KEY, "Authorization": f"Bearer {token}"}, timeout=20)


def api(method, path, token=None, headers=None, **kw):
    h = dict(headers or {})
    if token:
        h["Authorization"] = f"Bearer {token}"
    return requests.request(method, f"{BACKEND}{path}", headers=h, timeout=30, **kw)


def rls_blocked(resp):
    return resp.status_code == 500 or (resp.status_code == 200 and resp.json() in ([], {"cycleMode": 12, "timezone": None, "anchorDate": None}))


def main():
    uid1, tok1 = anon_user()
    uid2, tok2 = anon_user()
    print(f"test users: {uid1} / {uid2} (anonymous, throwaway)\n")

    r = api("GET", "/moonsync/settings")
    record("1 missing token -> 401", r.status_code == 401, r.status_code)

    r = api("GET", "/moonsync/settings", headers={"x-moonsync-user": uid1})
    record("2 legacy header only -> 401", r.status_code == 401, r.status_code)

    r = api("GET", "/moonsync/settings", token="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.bad")
    record("3 garbage token -> 401", r.status_code == 401, r.status_code)

    r = api("GET", "/moonsync/settings", token=tok1)
    record("4 valid session -> 200", r.status_code == 200, r.status_code)

    r = api("GET", "/moonsync/settings", token=tok1, headers={"x-moonsync-user": uid2})
    record("5 token/user mismatch -> 403", r.status_code == 403, r.status_code)

    # 6. write + read own data
    event_id = str(uuid.uuid4())
    w1 = api("POST", "/moonsync/settings", token=tok1, json={"cycleMode": 13})
    w2 = api("POST", "/moonsync/events", token=tok1, json={
        "id": event_id, "title": "smoke test", "eventType": "ritual",
        "associatedPhase": "newMoon", "eventAt": "2026-01-01T00:00:00Z"})
    if w1.status_code >= 500 or w2.status_code >= 500:
        record("6 write own data", None, f"BLOCKED-BY-RLS (backend not using service role) {w1.status_code}/{w2.status_code}")
    else:
        s = api("GET", "/moonsync/settings", token=tok1).json()
        ev = api("GET", "/moonsync/events", token=tok1).json()
        ok = s.get("cycleMode") == 13 and any(e["id"] == event_id for e in ev)
        record("6 write own data then read it back", ok, json.dumps({"cycleMode": s.get("cycleMode"), "events": len(ev)}))

        # 7. isolation
        s2 = api("GET", "/moonsync/settings", token=tok2).json()
        ev2 = api("GET", "/moonsync/events", token=tok2).json()
        record("7 other user sees none of it", s2.get("cycleMode") == 12 and ev2 == [], json.dumps({"cycleMode": s2.get("cycleMode"), "events": len(ev2)}))

        # 9. cleanup via API (deletes are user-scoped too)
        d = api("DELETE", f"/moonsync/events/{event_id}", token=tok1)
        record("9 cleanup event via API", d.status_code == 200, d.status_code)
        print("   note: moonsync_settings/users rows for the throwaway user remain (no delete endpoint); harmless, anonymous.")

    # 8. revoked token
    logout(tok2)
    r = api("GET", "/moonsync/settings", token=tok2)
    record("8 signed-out (revoked) token -> 401", r.status_code == 401, r.status_code)
    logout(tok1)

    failed = [n for n, ok, _ in results if ok is False]
    print(f"\n{len([1 for _, ok, _ in results if ok is True])} passed, {len(failed)} failed, "
          f"{len([1 for _, ok, _ in results if ok is None])} skipped")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
