"""Negative + positive tests for Vault / MoonSync authorization.

Proves:
  * unauthenticated requests cannot read or write user-scoped data
  * an invalid / forged token is rejected
  * the legacy `x-moonsync-user` header can no longer select another user's data
  * every read/write is scoped to the identity derived from the verified token
"""
import pytest

from tests.conftest import TOKEN_A, TOKEN_B, USER_A, USER_B, auth

EVENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

USER_SCOPED_ROUTES = [
    ("GET", "/api/moonsync/settings", None),
    ("POST", "/api/moonsync/settings", {"cycleMode": 13}),
    ("GET", "/api/moonsync/events", None),
    ("POST", "/api/moonsync/events", {
        "id": "evt-1", "title": "t", "eventType": "ritual",
        "associatedPhase": "newMoon", "eventAt": "2026-01-01T00:00:00Z",
    }),
    ("PUT", "/api/moonsync/events/evt-1", {
        "title": "t", "eventType": "ritual",
        "associatedPhase": "newMoon", "eventAt": "2026-01-01T00:00:00Z",
    }),
    ("DELETE", "/api/moonsync/events/evt-1", None),
    ("GET", "/api/moonsync/phases", None),
    ("GET", "/api/vault/spiral-notes/mod-1", None),
    ("PUT", "/api/vault/spiral-notes/mod-1", {"content": "x"}),
    ("GET", "/api/vault/entries", None),
    ("POST", "/api/vault/entries", {"content": "x", "tags": [], "type": "text"}),
]


def _call(client, method, path, body=None, headers=None):
    return client.request(method, path, json=body, headers=headers or {})


@pytest.mark.parametrize("method,path,body", USER_SCOPED_ROUTES)
def test_unauthenticated_request_is_rejected(client, fake_db, method, path, body):
    fake_db.store["vault_entries"] = [{"id": "e1", "user_id": USER_A, "content": "secret"}]

    response = _call(client, method, path, body)

    assert response.status_code == 401
    # nothing was written
    assert all(not rows for table, rows in fake_db.store.items() if table != "vault_entries")


@pytest.mark.parametrize("method,path,body", USER_SCOPED_ROUTES)
def test_forged_token_is_rejected(client, method, path, body):
    response = _call(client, method, path, body, headers=auth("not-a-real-token"))
    assert response.status_code == 401


@pytest.mark.parametrize("method,path,body", USER_SCOPED_ROUTES)
def test_legacy_header_alone_is_not_authentication(client, fake_db, method, path, body):
    """The old client contract (x-moonsync-user only) must no longer work."""
    fake_db.store["vault_entries"] = [{"id": "e1", "user_id": USER_A, "content": "secret"}]

    response = _call(client, method, path, body, headers={"x-moonsync-user": USER_A})

    assert response.status_code == 401
    assert "secret" not in response.text


def test_token_user_mismatch_cannot_read_other_users_vault(client, fake_db):
    fake_db.store["vault_entries"] = [{"id": "e1", "user_id": USER_A, "content": "A's private entry"}]

    # B holds a valid token but claims to be A via the legacy header
    response = client.get(
        "/api/vault/entries",
        headers={**auth(TOKEN_B), "x-moonsync-user": USER_A},
    )

    assert response.status_code == 403
    assert "A's private entry" not in response.text


def test_token_user_mismatch_cannot_write_other_users_moonsync(client, fake_db):
    response = client.post(
        "/api/moonsync/settings",
        json={"cycleMode": 13},
        headers={**auth(TOKEN_B), "x-moonsync-user": USER_A},
    )

    assert response.status_code == 403
    assert fake_db.store.get("moonsync_settings", []) == []


def test_reads_are_scoped_to_verified_user(client, fake_db):
    fake_db.store["vault_entries"] = [
        {"id": "e1", "user_id": USER_A, "content": "A's entry", "tags": [], "type": "text",
         "created_at": "2026-01-01T00:00:00+00:00"},
        {"id": "e2", "user_id": USER_B, "content": "B's entry", "tags": [], "type": "text",
         "created_at": "2026-01-01T00:00:00+00:00"},
    ]
    fake_db.store["moonsync_events"] = [
        {"id": EVENT_A, "user_id": USER_A, "title": "A event", "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
        {"id": "ev-b", "user_id": USER_B, "title": "B event", "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
    ]

    entries = client.get("/api/vault/entries", headers=auth(TOKEN_B)).json()
    assert [e["content"] for e in entries] == ["B's entry"]

    events = client.get("/api/moonsync/events", headers=auth(TOKEN_B)).json()
    assert [e["title"] for e in events] == ["B event"]


def test_writes_are_attributed_to_verified_user_not_payload(client, fake_db):
    response = client.post(
        "/api/vault/entries",
        json={"content": "hello", "tags": ["x"], "type": "text", "user_id": USER_A},
        headers=auth(TOKEN_B),
    )
    assert response.status_code == 200
    rows = fake_db.store["vault_entries"]
    assert len(rows) == 1
    assert rows[0]["user_id"] == USER_B


def test_update_and_delete_cannot_touch_other_users_event(client, fake_db):
    fake_db.store["moonsync_events"] = [
        {"id": EVENT_A, "user_id": USER_A, "title": "A event", "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
    ]

    client.put(
        f"/api/moonsync/events/{EVENT_A}",
        json={"title": "hijacked", "eventType": "ritual",
              "associatedPhase": "fullMoon", "eventAt": "2026-02-01T00:00:00Z"},
        headers=auth(TOKEN_B),
    )
    client.delete(f"/api/moonsync/events/{EVENT_A}", headers=auth(TOKEN_B))

    assert fake_db.store["moonsync_events"] == [
        {"id": EVENT_A, "user_id": USER_A, "title": "A event", "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
    ]


def test_matching_legacy_header_is_tolerated_for_old_clients(client, fake_db):
    """A stale client that still sends the header for its *own* id keeps working."""
    response = client.get(
        "/api/moonsync/settings",
        headers={**auth(TOKEN_A), "x-moonsync-user": USER_A},
    )
    assert response.status_code == 200
    assert response.json()["cycleMode"] == 12


def test_identity_comes_from_supabase_verification(client, fake_db):
    client.get("/api/vault/entries", headers=auth(TOKEN_A))
    assert fake_db.auth.calls == [TOKEN_A]


def test_status_endpoints_are_gone(client):
    assert client.get("/api/status").status_code == 404
    assert client.post("/api/status", json={"client_name": "x"}).status_code in (404, 405)
