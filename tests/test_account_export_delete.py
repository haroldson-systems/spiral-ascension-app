"""Account export + deletion: scoping, confirmation, Stripe-first fail-safety, retention."""
import pytest

from tests.conftest import EMAIL_A, TOKEN_A, TOKEN_B, USER_A, USER_B, auth


def seed(fake_db):
    fake_db.store["vault_entries"] = [
        {"id": "e1", "user_id": USER_A, "content": "A private", "tags": [], "type": "text", "created_at": "2026-01-01T00:00:00+00:00"},
        {"id": "e2", "user_id": USER_B, "content": "B private", "tags": [], "type": "text", "created_at": "2026-01-01T00:00:00+00:00"},
    ]
    fake_db.store["spiral_notes"] = [
        {"id": "n1", "user_id": USER_A, "module_id": "m1", "content": "A note", "updated_at": "2026-01-01T00:00:00+00:00"},
    ]
    fake_db.store["moonsync_settings"] = [{"user_id": USER_A, "cycle_mode": 13, "timezone": None, "anchor_date": None}]
    fake_db.store["moonsync_events"] = [
        {"id": "ev1", "user_id": USER_A, "title": "A event", "event_type": "ritual", "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
        {"id": "ev2", "user_id": USER_B, "title": "B event", "event_type": "ritual", "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z"},
    ]
    fake_db.store["users"] = [{"id": USER_A}, {"id": USER_B}]
    fake_db.store["billing_subscriptions"] = [
        {"id": "b1", "stripe_subscription_id": "sub_A", "stripe_customer_id": "cus_A", "customer_email": EMAIL_A.lower(),
         "status": "active", "cancel_at_period_end": False, "trial_end": None, "current_period_end": "2026-02-01T00:00:00+00:00", "metadata": {}},
        {"id": "b2", "stripe_subscription_id": "sub_B", "stripe_customer_id": "cus_B", "customer_email": "userb@example.com",
         "status": "active", "cancel_at_period_end": False, "trial_end": None, "current_period_end": None, "metadata": {}},
    ]


class FakeStripeSubscription:
    cancelled = []
    fail = False

    @classmethod
    def cancel(cls, sub_id):
        if cls.fail:
            raise Exception("stripe down")
        cls.cancelled.append(sub_id)


@pytest.fixture()
def stripe_stub(server_module, monkeypatch):
    FakeStripeSubscription.cancelled = []
    FakeStripeSubscription.fail = False
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(server_module.stripe, "Subscription", FakeStripeSubscription)
    return FakeStripeSubscription


# --- export -------------------------------------------------------------------

def test_export_requires_auth(client, fake_db):
    seed(fake_db)
    assert client.get("/api/account/export").status_code == 401
    assert client.get("/api/account/export", headers={"x-moonsync-user": USER_A}).status_code == 401


def test_export_contains_only_own_data(client, fake_db):
    seed(fake_db)
    res = client.get("/api/account/export", headers=auth(TOKEN_A))
    assert res.status_code == 200
    assert res.headers["content-disposition"].startswith('attachment; filename="spiral-ascension-export-')
    data = res.json()

    assert data["account"] == {"id": USER_A, "email": EMAIL_A, "createdAt": "2026-01-01T00:00:00+00:00", "isAnonymous": False}
    assert [e["content"] for e in data["vault"]["entries"]] == ["A private"]
    assert [n["module_id"] for n in data["vault"]["spiralNotes"]] == ["m1"]
    assert data["moonsync"]["settings"] == [{"cycle_mode": 13, "timezone": None, "anchor_date": None}]
    assert [e["title"] for e in data["moonsync"]["events"]] == ["A event"]
    assert data["billing"]["subscriptions"] == [{
        "status": "active", "cancelAtPeriodEnd": False, "trialEnd": None,
        "currentPeriodEnd": "2026-02-01T00:00:00+00:00", "updatedAt": None,
    }]
    assert "B private" not in res.text
    assert "sub_A" not in res.text  # no Stripe ids leak into the export


def test_export_works_with_empty_tables(client, fake_db):
    res = client.get("/api/account/export", headers=auth(TOKEN_B))
    assert res.status_code == 200
    body = res.json()
    assert body["vault"] == {"entries": [], "spiralNotes": []}
    assert body["billing"]["subscriptions"] == []


# --- delete -------------------------------------------------------------------

def test_delete_requires_auth_and_confirmation(client, fake_db, stripe_stub):
    seed(fake_db)
    assert client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}).status_code == 401

    res = client.request("DELETE", "/api/account", json={"confirmation": "delete"}, headers=auth(TOKEN_A))
    assert res.status_code == 400
    res = client.request("DELETE", "/api/account", json={"confirmation": ""}, headers=auth(TOKEN_A))
    assert res.status_code == 400
    res = client.request("DELETE", "/api/account", json={}, headers=auth(TOKEN_A))
    assert res.status_code == 422

    # nothing touched
    assert len(fake_db.store["vault_entries"]) == 2
    assert fake_db.auth.admin.deleted_users == []
    assert stripe_stub.cancelled == []


def test_delete_removes_own_data_cancels_subscription_and_retains_scrubbed_billing(client, fake_db, stripe_stub):
    seed(fake_db)
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}, headers=auth(TOKEN_A))
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["deleted"] is True
    assert body["removed"] == {"vault_entries": 1, "spiral_notes": 1, "moonsync_events": 1, "moonsync_settings": 1}
    assert body["subscriptionsCancelled"] == 1
    assert body["billingRecordsAnonymized"] == 1

    # Stripe: A cancelled, B untouched
    assert stripe_stub.cancelled == ["sub_A"]

    # A's rows gone, B's intact
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_B]
    assert fake_db.store["spiral_notes"] == []
    assert [r["user_id"] for r in fake_db.store["moonsync_events"]] == [USER_B]
    assert fake_db.store["moonsync_settings"] == []
    assert fake_db.store["users"] == [{"id": USER_B}]

    # billing snapshot retained but anonymized
    a_billing = next(r for r in fake_db.store["billing_subscriptions"] if r["id"] == "b1")
    assert a_billing["customer_email"] is None
    assert a_billing["stripe_subscription_id"] == "sub_A"
    assert "account_deleted_at" in a_billing["metadata"]
    b_billing = next(r for r in fake_db.store["billing_subscriptions"] if r["id"] == "b2")
    assert b_billing["customer_email"] == "userb@example.com"

    # auth account removed
    assert fake_db.auth.admin.deleted_users == [USER_A]


def test_delete_aborts_before_removing_anything_if_stripe_fails(client, fake_db, stripe_stub):
    seed(fake_db)
    stripe_stub.fail = True
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}, headers=auth(TOKEN_A))
    assert res.status_code == 502
    assert "Nothing was deleted" in res.json()["detail"]

    assert len(fake_db.store["vault_entries"]) == 2
    assert len(fake_db.store["users"]) == 2
    assert fake_db.store["billing_subscriptions"][0]["customer_email"] == EMAIL_A.lower()
    assert fake_db.auth.admin.deleted_users == []


def test_delete_aborts_if_active_subscription_but_stripe_unconfigured(client, fake_db, server_module, monkeypatch):
    seed(fake_db)
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", None)
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}, headers=auth(TOKEN_A))
    assert res.status_code == 503
    assert len(fake_db.store["vault_entries"]) == 2
    assert fake_db.auth.admin.deleted_users == []


def test_delete_without_subscription_skips_stripe(client, fake_db, stripe_stub):
    seed(fake_db)
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}, headers=auth(TOKEN_B))
    assert res.status_code == 200
    # B's subscription row was active but matched by email; cancelled
    assert stripe_stub.cancelled == ["sub_B"]
    assert fake_db.auth.admin.deleted_users == [USER_B]
    # A untouched
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_A]


def test_delete_reports_auth_deletion_failure(client, fake_db, stripe_stub):
    seed(fake_db)
    fake_db.auth.admin.fail = True
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}, headers=auth(TOKEN_A))
    assert res.status_code == 500
    assert "contact support" in res.json()["detail"]
    # data was removed, subscription cancelled – message tells user what happened
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_B]
    assert stripe_stub.cancelled == ["sub_A"]


def test_delete_cannot_be_redirected_with_legacy_header(client, fake_db, stripe_stub):
    seed(fake_db)
    res = client.request(
        "DELETE", "/api/account", json={"confirmation": "DELETE"},
        headers={**auth(TOKEN_B), "x-moonsync-user": USER_A},
    )
    assert res.status_code == 403
    assert len(fake_db.store["vault_entries"]) == 2
    assert fake_db.auth.admin.deleted_users == []
