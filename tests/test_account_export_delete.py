"""Account export + deletion.

Ownership model under test: billing rows belong to a user via `billing_subscriptions.user_id`
(bound at checkout / backfilled). Email is never an ownership key.
"""
import pytest

from tests.conftest import EMAIL_A, TOKEN_A, TOKEN_B, USER_A, USER_B, auth

SUB_A = {"id": "b1", "stripe_subscription_id": "sub_A", "stripe_customer_id": "cus_A", "customer_email": EMAIL_A.lower(),
         "user_id": USER_A, "status": "active", "cancel_at_period_end": False, "trial_end": None,
         "current_period_end": "2026-02-01T00:00:00+00:00", "metadata": {}}
SUB_B = {"id": "b2", "stripe_subscription_id": "sub_B", "stripe_customer_id": "cus_B", "customer_email": "userb@example.com",
         "user_id": USER_B, "status": "active", "cancel_at_period_end": False, "trial_end": None,
         "current_period_end": None, "metadata": {}}


def seed(fake_db, billing=None):
    fake_db.store["vault_entries"] = [
        {"id": "e1", "user_id": USER_A, "title": "T", "content": "A private", "tags": [], "type": "text",
         "created_at": "2026-01-01T00:00:00+00:00", "updated_at": "2026-01-01T00:00:00+00:00"},
        {"id": "e2", "user_id": USER_B, "title": None, "content": "B private", "tags": [], "type": "text",
         "created_at": "2026-01-01T00:00:00+00:00", "updated_at": None},
    ]
    fake_db.store["spiral_notes"] = [
        {"id": "n1", "user_id": USER_A, "module_id": "m1", "content": "A note", "updated_at": "2026-01-01T00:00:00+00:00"},
    ]
    fake_db.store["moonsync_settings"] = [{"user_id": USER_A, "cycle_mode": 13, "timezone": None, "anchor_date": None, "updated_at": None}]
    fake_db.store["moonsync_events"] = [
        {"id": "ev1", "user_id": USER_A, "title": "A event", "description": None, "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z", "created_at": None},
        {"id": "ev2", "user_id": USER_B, "title": "B event", "description": None, "event_type": "ritual",
         "associated_phase": "newMoon", "event_at": "2026-01-01T00:00:00Z", "created_at": None},
    ]
    fake_db.store["users"] = [{"id": USER_A}, {"id": USER_B}]
    fake_db.store["profiles"] = [
        {"id": USER_A, "email": EMAIL_A, "created_at": "2026-01-01T00:00:00+00:00", "role": "member"},
        {"id": USER_B, "email": "userb@example.com", "created_at": "2026-01-01T00:00:00+00:00", "role": "member"},
    ]
    fake_db.store["billing_subscriptions"] = [dict(r) for r in (billing if billing is not None else [SUB_A, SUB_B])]


class FakeStripeSubscription:
    cancelled = []
    fail_on = set()          # subscription ids that raise

    @classmethod
    def cancel(cls, sub_id):
        if sub_id in cls.fail_on:
            raise Exception("stripe down")
        cls.cancelled.append(sub_id)


@pytest.fixture()
def stripe_stub(server_module, monkeypatch):
    FakeStripeSubscription.cancelled = []
    FakeStripeSubscription.fail_on = set()
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(server_module.stripe, "Subscription", FakeStripeSubscription)
    return FakeStripeSubscription


def delete(client, token, confirmation="DELETE", **headers):
    return client.request("DELETE", "/api/account", json={"confirmation": confirmation}, headers={**auth(token), **headers})


def untouched(fake_db):
    return (len(fake_db.store["vault_entries"]) == 2 and len(fake_db.store["users"]) == 2
            and len(fake_db.store["profiles"]) == 2 and fake_db.auth.admin.deleted_users == [])


# --- export -------------------------------------------------------------------

def test_export_requires_auth(client, fake_db):
    seed(fake_db)
    assert client.get("/api/account/export").status_code == 401
    assert client.get("/api/account/export", headers={"x-moonsync-user": USER_A}).status_code == 401


def test_export_contains_every_user_owned_table_and_all_columns(client, fake_db):
    """Inventory of production user-owned tables (verified 2026-09-16 via PostgREST):
    users, profiles, moonsync_settings, moonsync_events, vault_entries, spiral_notes (after hotfix),
    billing_subscriptions. Export must cover all of them with every column present."""
    seed(fake_db)
    res = client.get("/api/account/export", headers=auth(TOKEN_A))
    assert res.status_code == 200
    assert res.headers["content-disposition"].startswith('attachment; filename="spiral-ascension-export-')
    data = res.json()

    assert data["exportVersion"] == 2
    assert data["account"] == {"id": USER_A, "email": EMAIL_A, "createdAt": "2026-01-01T00:00:00+00:00", "isAnonymous": False}
    assert data["profile"] == [{"id": USER_A, "email": EMAIL_A, "created_at": "2026-01-01T00:00:00+00:00", "role": "member"}]
    # select * → includes columns the code never named (title, updated_at)
    assert data["vault"]["entries"] == [{"id": "e1", "title": "T", "content": "A private", "tags": [], "type": "text",
                                         "created_at": "2026-01-01T00:00:00+00:00", "updated_at": "2026-01-01T00:00:00+00:00"}]
    assert [n["module_id"] for n in data["vault"]["spiralNotes"]] == ["m1"]
    assert data["moonsync"]["settings"] == [{"cycle_mode": 13, "timezone": None, "anchor_date": None, "updated_at": None}]
    assert [e["title"] for e in data["moonsync"]["events"]] == ["A event"]
    assert data["billing"]["subscriptions"] == [{
        "status": "active", "cancelAtPeriodEnd": False, "trialEnd": None,
        "currentPeriodEnd": "2026-02-01T00:00:00+00:00", "updatedAt": None,
    }]
    assert data["billing"]["unlinkedSubscriptionsMatchingEmail"] == 0
    assert "B private" not in res.text and "userb@example.com" not in res.text
    assert "sub_A" not in res.text and "cus_A" not in res.text   # no Stripe ids leak


def test_export_uses_user_id_not_email_for_billing(client, fake_db):
    """A row that merely shares A's email but belongs to nobody (unbound) is not exported as A's,
    only counted; a row bound to A with a *different* email IS A's."""
    seed(fake_db, billing=[
        {**SUB_A, "id": "b1", "user_id": None},                                # legacy unbound, same email
        {**SUB_A, "id": "b9", "stripe_subscription_id": "sub_A2", "customer_email": "old-address@example.com", "user_id": USER_A},
    ])
    data = client.get("/api/account/export", headers=auth(TOKEN_A)).json()
    assert len(data["billing"]["subscriptions"]) == 1
    assert data["billing"]["unlinkedSubscriptionsMatchingEmail"] == 1


def test_export_survives_missing_tables(client, fake_db):
    # spiral_notes / profiles absent (pre-hotfix production) → empty lists, not 500
    res = client.get("/api/account/export", headers=auth(TOKEN_B))
    assert res.status_code == 200
    body = res.json()
    assert body["vault"] == {"entries": [], "spiralNotes": []}
    assert body["profile"] == []
    assert body["billing"]["subscriptions"] == []


# --- delete: guards -----------------------------------------------------------

def test_delete_requires_auth_and_exact_confirmation(client, fake_db, stripe_stub):
    seed(fake_db)
    assert client.request("DELETE", "/api/account", json={"confirmation": "DELETE"}).status_code == 401
    assert delete(client, TOKEN_A, "delete").status_code == 400
    assert delete(client, TOKEN_A, "").status_code == 400
    assert client.request("DELETE", "/api/account", json={}, headers=auth(TOKEN_A)).status_code == 422
    assert untouched(fake_db) and stripe_stub.cancelled == []


def test_delete_cannot_be_redirected_with_legacy_header(client, fake_db, stripe_stub):
    seed(fake_db)
    res = client.request("DELETE", "/api/account", json={"confirmation": "DELETE"},
                         headers={**auth(TOKEN_B), "x-moonsync-user": USER_A})
    assert res.status_code == 403 and untouched(fake_db)


def test_delete_blocked_when_unbound_active_subscription_matches_email(client, fake_db, stripe_stub):
    """Email-only match is not ownership: refuse, so we never cancel a stranger's sub
    nor delete data while an unlinked subscription keeps charging."""
    seed(fake_db, billing=[{**SUB_A, "user_id": None}])
    res = delete(client, TOKEN_A)
    assert res.status_code == 409
    assert "not yet linked" in res.json()["detail"]
    assert untouched(fake_db) and stripe_stub.cancelled == []


def test_unbound_but_cancelled_subscription_does_not_block(client, fake_db, stripe_stub):
    seed(fake_db, billing=[{**SUB_A, "user_id": None, "status": "canceled"}])
    assert delete(client, TOKEN_A).status_code == 200


# --- delete: happy path -------------------------------------------------------

def test_delete_happy_path(client, fake_db, stripe_stub):
    seed(fake_db)
    res = delete(client, TOKEN_A)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["deleted"] is True
    assert body["removed"] == {"vault_entries": 1, "spiral_notes": 1, "moonsync_events": 1, "moonsync_settings": 1,
                               "profiles": 1, "users": 1}
    assert body["subscriptionsCancelled"] == 1 and body["billingRecordsAnonymized"] == 1

    assert stripe_stub.cancelled == ["sub_A"]
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_B]
    assert fake_db.store["spiral_notes"] == []
    assert [r["user_id"] for r in fake_db.store["moonsync_events"]] == [USER_B]
    assert fake_db.store["moonsync_settings"] == []
    assert fake_db.store["users"] == [{"id": USER_B}]
    assert [p["id"] for p in fake_db.store["profiles"]] == [USER_B]

    a_billing = next(r for r in fake_db.store["billing_subscriptions"] if r["id"] == "b1")
    assert a_billing["customer_email"] is None and a_billing["stripe_subscription_id"] == "sub_A"
    assert "account_deleted_at" in a_billing["metadata"]
    b_billing = next(r for r in fake_db.store["billing_subscriptions"] if r["id"] == "b2")
    assert b_billing["customer_email"] == "userb@example.com"
    assert fake_db.auth.admin.deleted_users == [USER_A]


def test_delete_bound_row_with_changed_email_is_still_cancelled(client, fake_db, stripe_stub):
    """User changed their email after subscribing: binding by user_id still finds the sub."""
    seed(fake_db, billing=[{**SUB_A, "customer_email": "old-address@example.com"}])
    assert delete(client, TOKEN_A).status_code == 200
    assert stripe_stub.cancelled == ["sub_A"]


def test_delete_without_any_subscription_skips_stripe(client, fake_db, stripe_stub):
    seed(fake_db, billing=[])
    res = delete(client, TOKEN_B)
    assert res.status_code == 200 and res.json()["subscriptionsCancelled"] == 0
    assert stripe_stub.cancelled == [] and fake_db.auth.admin.deleted_users == [USER_B]
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_A]


# --- delete: Stripe failure modes --------------------------------------------

def test_stripe_failure_aborts_before_removing_anything(client, fake_db, stripe_stub):
    seed(fake_db)
    stripe_stub.fail_on = {"sub_A"}
    res = delete(client, TOKEN_A)
    assert res.status_code == 502 and "Nothing was deleted" in res.json()["detail"]
    assert untouched(fake_db)
    assert fake_db.store["billing_subscriptions"][0]["customer_email"] == EMAIL_A.lower()


def test_stripe_unconfigured_with_active_sub_aborts(client, fake_db, server_module, monkeypatch):
    seed(fake_db)
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", None)
    assert delete(client, TOKEN_A).status_code == 503 and untouched(fake_db)


def test_partial_cancellation_then_failure_deletes_nothing_and_retry_completes(client, fake_db, stripe_stub):
    """Two active subs: first cancels, second fails → 502, nothing deleted, first stays cancelled.
    Retry: Stripe now says the first is already canceled (idempotent) and the second succeeds."""
    seed(fake_db, billing=[
        {**SUB_A, "id": "b1", "stripe_subscription_id": "sub_A1"},
        {**SUB_A, "id": "b3", "stripe_subscription_id": "sub_A2"},
    ])
    stripe_stub.fail_on = {"sub_A2"}
    res = delete(client, TOKEN_A)
    assert res.status_code == 502
    assert "1 of 2 cancelled" in res.json()["detail"]
    assert stripe_stub.cancelled == ["sub_A1"]
    assert untouched(fake_db)
    assert all(r["customer_email"] for r in fake_db.store["billing_subscriptions"])  # not anonymized yet

    # retry: sub_A1 already canceled at Stripe, sub_A2 now works
    stripe_stub.fail_on = set()
    stripe_stub.cancelled = []

    def cancel(sub_id, _orig=stripe_stub.cancel):
        if sub_id == "sub_A1":
            raise Exception("This subscription has already been canceled")
        return _orig(sub_id)
    stripe_stub.cancel = staticmethod(cancel)

    res = delete(client, TOKEN_A)
    assert res.status_code == 200, res.text
    assert res.json()["subscriptionsCancelled"] == 2
    assert fake_db.auth.admin.deleted_users == [USER_A]


# --- delete: anonymization + interruption/retry --------------------------------

def test_anonymization_failure_is_not_reported_as_success(client, fake_db, stripe_stub, server_module, monkeypatch):
    seed(fake_db)
    real_table = fake_db.table

    class Boom:
        def update(self, *_a, **_k):
            raise RuntimeError("db write failed")

    def table(name):
        return Boom() if name == "billing_subscriptions" and getattr(table, "arm", False) else real_table(name)
    monkeypatch.setattr(fake_db, "table", table)
    table.arm = False

    # arm only for the update step: reads happen first, so flip after the first read via a wrapper
    orig_anon = server_module._anonymize_billing_rows

    def anon(rows):
        table.arm = True
        try:
            return orig_anon(rows)
        finally:
            table.arm = False
    monkeypatch.setattr(server_module, "_anonymize_billing_rows", anon)

    res = delete(client, TOKEN_A)
    assert res.status_code == 500 and "anonymize" in res.json()["detail"]
    assert stripe_stub.cancelled == ["sub_A"]          # step 1 done (safe: no more charging)
    assert untouched(fake_db)                          # steps 3-5 never ran
    assert fake_db.store["billing_subscriptions"][0]["customer_email"] == EMAIL_A.lower()


@pytest.mark.parametrize("fail_table", ["vault_entries", "moonsync_events", "profiles", "users"])
def test_interrupted_row_deletion_returns_500_and_retry_completes(client, fake_db, stripe_stub, fail_table):
    """Simulate the DB failing at step 3/4 for one table; the response must not claim success,
    the subscription is already cancelled (no further charging), and a plain retry finishes."""
    seed(fake_db)
    real_table = fake_db.table
    state = {"armed": True}

    class FailingDelete:
        def __init__(self, q):
            self.q = q

        def delete(self):
            if state["armed"]:
                from postgrest.exceptions import APIError
                raise APIError({"message": "connection reset", "code": "08006", "hint": None, "details": None})
            return self.q.delete()

        def __getattr__(self, name):
            return getattr(self.q, name)

    def table(name):
        q = real_table(name)
        return FailingDelete(q) if name == fail_table else q
    fake_db.table = table

    res = delete(client, TOKEN_A)
    assert res.status_code == 500
    assert "try again" in res.json()["detail"].lower()
    assert stripe_stub.cancelled == ["sub_A"]
    assert fake_db.auth.admin.deleted_users == []      # never removes the login before the data

    state["armed"] = False
    res = delete(client, TOKEN_A)                       # same token still valid → retry
    assert res.status_code == 200, res.text
    assert fake_db.auth.admin.deleted_users == [USER_A]
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_B]
    assert fake_db.store["users"] == [{"id": USER_B}]
    assert [p["id"] for p in fake_db.store["profiles"]] == [USER_B]


def test_auth_deletion_failure_reports_and_retry_completes(client, fake_db, stripe_stub):
    seed(fake_db)
    fake_db.auth.admin.fail = True
    res = delete(client, TOKEN_A)
    assert res.status_code == 500 and "try again" in res.json()["detail"].lower()
    assert stripe_stub.cancelled == ["sub_A"]
    assert [r["user_id"] for r in fake_db.store["vault_entries"]] == [USER_B]

    fake_db.auth.admin.fail = False
    res = delete(client, TOKEN_A)
    assert res.status_code == 200
    assert fake_db.auth.admin.deleted_users == [USER_A]
