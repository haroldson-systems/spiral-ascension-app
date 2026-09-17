"""MoonSync events must be stored under UUID ids.

Production `moonsync_events.id` is a Postgres uuid column. The old frontend generated
`event_<timestamp>_<random>` ids, Postgres rejected them (22P02) and the event was never
saved – which is why `moonsync.events` came back empty in the account export.
"""
import uuid

from tests.conftest import TOKEN_A, USER_A, auth

EVENT_BODY = {
    "title": "New moon ritual",
    "description": "",
    "eventType": "ritual",
    "associatedPhase": "newMoon",
    "eventAt": "2026-10-01T00:00:00.000Z",
}


def _is_uuid(value):
    uuid.UUID(str(value))
    return True


def test_legacy_non_uuid_client_id_is_replaced_and_event_is_saved(client, fake_db):
    response = client.post(
        "/api/moonsync/events",
        json={"id": "event_1758064438000_k3j9x2abc", **EVENT_BODY},
        headers=auth(TOKEN_A),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True and _is_uuid(body["id"])

    rows = fake_db.store["moonsync_events"]
    assert len(rows) == 1
    assert rows[0]["id"] == body["id"]
    assert rows[0]["user_id"] == USER_A
    assert rows[0]["title"] == "New moon ritual"


def test_valid_client_uuid_is_kept(client, fake_db):
    client_id = str(uuid.uuid4())
    response = client.post("/api/moonsync/events", json={"id": client_id, **EVENT_BODY}, headers=auth(TOKEN_A))
    assert response.status_code == 200
    assert response.json()["id"] == client_id
    assert fake_db.store["moonsync_events"][0]["id"] == client_id


def test_missing_client_id_gets_a_server_uuid(client, fake_db):
    response = client.post("/api/moonsync/events", json=EVENT_BODY, headers=auth(TOKEN_A))
    assert response.status_code == 200
    assert _is_uuid(response.json()["id"])


def test_saved_event_round_trips_into_list_and_export(client):
    created = client.post("/api/moonsync/events", json={"id": "event_legacy_123", **EVENT_BODY}, headers=auth(TOKEN_A)).json()

    listed = client.get("/api/moonsync/events", headers=auth(TOKEN_A)).json()
    assert [e["id"] for e in listed] == [created["id"]]
    assert listed[0]["title"] == "New moon ritual"

    export = client.get("/api/account/export", headers=auth(TOKEN_A)).json()
    assert len(export["moonsync"]["events"]) == 1
    assert export["moonsync"]["events"][0]["id"] == created["id"]
    assert export["moonsync"]["events"][0]["title"] == "New moon ritual"


def test_update_and_delete_with_non_uuid_id_return_404_not_500(client):
    put = client.put("/api/moonsync/events/event_legacy_123", json=EVENT_BODY, headers=auth(TOKEN_A))
    assert put.status_code == 404
    delete = client.delete("/api/moonsync/events/event_legacy_123", headers=auth(TOKEN_A))
    assert delete.status_code == 404
