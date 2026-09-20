"""Billing hardening: portal bound to verified user, webhook idempotency, failed-payment handling."""
from types import SimpleNamespace

import pytest

from tests.conftest import EMAIL_A, TOKEN_A, TOKEN_B, USER_A, auth


def seed_billing(fake_db, bound=True):
    fake_db.store["billing_subscriptions"] = [
        {"id": "b1", "stripe_subscription_id": "sub_A", "stripe_customer_id": "cus_A", "customer_email": EMAIL_A.lower(),
         "user_id": USER_A if bound else None,
         "status": "active", "cancel_at_period_end": False, "trial_end": None, "current_period_end": None,
         "metadata": {}, "updated_at": "2026-01-02T00:00:00+00:00"},
        {"id": "b0", "stripe_subscription_id": "sub_A_old", "stripe_customer_id": "cus_A_old", "customer_email": EMAIL_A.lower(),
         "user_id": USER_A if bound else None,
         "status": "canceled", "cancel_at_period_end": False, "trial_end": None, "current_period_end": None,
         "metadata": {}, "updated_at": "2025-01-01T00:00:00+00:00"},
    ]


class PortalSessionStub:
    calls = []

    @classmethod
    def create(cls, **kwargs):
        cls.calls.append(kwargs)
        return SimpleNamespace(url="https://billing.stripe.com/session/test")


@pytest.fixture()
def stripe_stub(server_module, monkeypatch):
    PortalSessionStub.calls = []
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(server_module, "STRIPE_PRICE_ID", "price_dummy")
    monkeypatch.setattr(server_module, "STRIPE_WEBHOOK_SECRET", "whsec_dummy")
    monkeypatch.setattr(server_module.stripe.billing_portal, "Session", PortalSessionStub)
    return PortalSessionStub


# --- portal -------------------------------------------------------------------

def test_portal_requires_signed_in_user(client, fake_db, stripe_stub):
    seed_billing(fake_db)
    assert client.post("/api/billing/portal", json={}).status_code == 401
    # email in the body is not an authorization
    assert client.post("/api/billing/portal", json={"email": EMAIL_A}).status_code == 401
    assert stripe_stub.calls == []


def test_portal_uses_stored_customer_of_verified_user(client, fake_db, stripe_stub):
    seed_billing(fake_db)
    res = client.post(
        "/api/billing/portal",
        json={"email": "attacker@example.com", "customerId": "cus_X", "returnUrl": "https://evil.example/steal"},
        headers={**auth(TOKEN_A), "origin": "https://thespiralascension.com"},
    )
    assert res.status_code == 200
    assert res.json() == {"url": "https://billing.stripe.com/session/test"}
    assert len(stripe_stub.calls) == 1
    assert stripe_stub.calls[0]["customer"] == "cus_A"  # most recent row, not the old one, not client input
    # off-origin return URL is ignored
    assert stripe_stub.calls[0]["return_url"] == "https://thespiralascension.com/account"


def test_portal_404_when_user_has_no_customer(client, fake_db, stripe_stub):
    seed_billing(fake_db)
    res = client.post("/api/billing/portal", json={}, headers=auth(TOKEN_B))
    assert res.status_code == 404
    assert stripe_stub.calls == []


def test_portal_refuses_email_only_match(client, fake_db, stripe_stub):
    """Row shares A's email but is not bound to A's user id → 409, portal never opened."""
    seed_billing(fake_db, bound=False)
    res = client.post("/api/billing/portal", json={}, headers=auth(TOKEN_A))
    assert res.status_code == 409 and "not linked" in res.json()["detail"]
    assert stripe_stub.calls == []


def test_portal_follows_user_id_even_if_email_changed(client, fake_db, stripe_stub):
    seed_billing(fake_db)
    fake_db.store["billing_subscriptions"][0]["customer_email"] = "old-address@example.com"
    res = client.post("/api/billing/portal", json={}, headers=auth(TOKEN_A))
    assert res.status_code == 200 and stripe_stub.calls[0]["customer"] == "cus_A"


def test_legacy_unauthenticated_checkout_endpoint_removed(client):
    res = client.post("/api/stripe/checkout-session", json={"successUrl": "https://x", "cancelUrl": "https://y"})
    assert res.status_code in (404, 405)


def test_billing_status_scoped_to_user(client, fake_db, stripe_stub):
    seed_billing(fake_db)
    fake_db.store["billing_subscriptions"][0]["status"] = "past_due"
    fake_db.store["billing_subscriptions"][0]["metadata"] = {"last_payment_failed_at": "2026-01-03T00:00:00+00:00"}

    a = client.get("/api/billing/status", headers=auth(TOKEN_A)).json()
    assert a["hasCustomer"] is True and a["status"] == "past_due" and a["paymentFailed"] is True

    b = client.get("/api/billing/status", headers=auth(TOKEN_B)).json()
    assert b == {"hasCustomer": False, "status": None, "cancelAtPeriodEnd": False,
                 "trialEnd": None, "currentPeriodEnd": None, "paymentFailed": False, "needsLinking": False}


def test_billing_status_flags_unbound_email_match(client, fake_db, stripe_stub):
    seed_billing(fake_db, bound=False)
    a = client.get("/api/billing/status", headers=auth(TOKEN_A)).json()
    assert a["hasCustomer"] is False and a["needsLinking"] is True


# --- webhook -----------------------------------------------------------------

def make_subscription(sub_id="sub_A", status="active", customer="cus_A"):
    price = SimpleNamespace(id="price_1", product="prod_1")
    return SimpleNamespace(
        id=sub_id, customer=customer, status=status, cancel_at_period_end=False,
        trial_end=None, current_period_end=1_800_000_000, metadata={},
        items=SimpleNamespace(data=[SimpleNamespace(price=price)]),
    )


@pytest.fixture()
def webhook(server_module, monkeypatch, stripe_stub):
    """Feed pre-built events straight past signature verification."""
    state = {"event": None, "retrieved": []}

    class WebhookStub:
        @staticmethod
        def construct_event(payload, sig, secret):
            assert sig == "sig_ok" and secret == "whsec_dummy"
            return state["event"]

    class SubscriptionStub:
        @staticmethod
        def retrieve(sub_id, expand=None):
            state["retrieved"].append(sub_id)
            return make_subscription(sub_id, status=state.get("status", "active"))

    monkeypatch.setattr(server_module.stripe, "Webhook", WebhookStub)
    monkeypatch.setattr(server_module.stripe, "Subscription", SubscriptionStub)

    def send(client, event_id, event_type, obj):
        state["event"] = {"id": event_id, "type": event_type, "data": {"object": obj}}
        return client.post("/api/billing/webhook", content=b"{}", headers={"stripe-signature": "sig_ok"})

    state["send"] = send
    return state


def test_webhook_rejects_missing_signature(client, stripe_stub):
    assert client.post("/api/billing/webhook", content=b"{}").status_code == 400


def test_webhook_is_idempotent(client, fake_db, webhook):
    sub = make_subscription(status="active")
    r1 = webhook["send"](client, "evt_1", "customer.subscription.updated", sub)
    assert r1.status_code == 200 and "duplicate" not in r1.json()
    assert len(fake_db.store["billing_subscriptions"]) == 1

    # Stripe redelivers the same event
    fake_db.store["billing_subscriptions"][0]["status"] = "tampered"
    r2 = webhook["send"](client, "evt_1", "customer.subscription.updated", sub)
    assert r2.status_code == 200 and r2.json()["duplicate"] is True
    assert fake_db.store["billing_subscriptions"][0]["status"] == "tampered"  # not reprocessed
    assert [e["event_id"] for e in fake_db.store["billing_webhook_events"]] == ["evt_1"]


def test_webhook_payment_failed_marks_subscription(client, fake_db, webhook):
    webhook["status"] = "past_due"
    invoice = SimpleNamespace(subscription="sub_A", attempt_count=2, next_payment_attempt=1_800_100_000)
    res = webhook["send"](client, "evt_pf", "invoice.payment_failed", invoice)
    assert res.status_code == 200
    assert "payment failed" in res.json()["outcome"]
    assert webhook["retrieved"] == ["sub_A"]

    row = fake_db.store["billing_subscriptions"][0]
    assert row["status"] == "past_due"
    assert row["metadata"]["last_payment_failed_at"]
    assert row["metadata"]["last_payment_attempt_count"] == 2
    assert row["metadata"]["next_payment_attempt"].startswith("2027-")


def test_webhook_payment_recovered_clears_flag(client, fake_db, webhook):
    webhook["status"] = "past_due"
    webhook["send"](client, "evt_pf", "invoice.payment_failed", SimpleNamespace(subscription="sub_A", attempt_count=1, next_payment_attempt=None))
    webhook["status"] = "active"
    res = webhook["send"](client, "evt_paid", "invoice.paid", SimpleNamespace(subscription="sub_A"))
    assert res.status_code == 200
    row = fake_db.store["billing_subscriptions"][0]
    assert row["status"] == "active"
    assert row["metadata"]["last_payment_failed_at"] is None


def test_webhook_releases_claim_on_processing_error(client, fake_db, webhook, server_module, monkeypatch):
    def boom(*_a, **_k):
        raise RuntimeError("stripe exploded")
    monkeypatch.setattr(server_module.stripe.Subscription, "retrieve", boom)

    res = webhook["send"](client, "evt_err", "invoice.payment_failed", SimpleNamespace(subscription="sub_A", attempt_count=1, next_payment_attempt=None))
    assert res.status_code == 500  # Stripe will retry
    assert fake_db.store.get("billing_webhook_events", []) == []  # claim released so the retry is processed


def test_webhook_unhandled_event_is_acknowledged(client, fake_db, webhook):
    res = webhook["send"](client, "evt_x", "charge.refunded", SimpleNamespace())
    assert res.status_code == 200 and res.json()["outcome"] == "unhandled"


def test_webhook_fails_closed_without_dedupe_table(client, fake_db, webhook, server_module, monkeypatch):
    """Missing billing_webhook_events → 503 (Stripe retries), nothing processed, loud error."""
    real_table = fake_db.table

    class MissingTable:
        def insert(self, *_a, **_k):
            return self

        def execute(self):
            from postgrest.exceptions import APIError
            raise APIError({"message": "Could not find the table 'public.billing_webhook_events' in the schema cache",
                            "code": "PGRST205", "hint": None, "details": None})

    monkeypatch.setattr(fake_db, "table", lambda name: MissingTable() if name == "billing_webhook_events" else real_table(name))
    res = webhook["send"](client, "evt_1", "customer.subscription.updated", make_subscription())
    assert res.status_code == 503
    assert fake_db.store.get("billing_subscriptions", []) == []
