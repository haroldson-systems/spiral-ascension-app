"""Webhook writes billing_subscriptions.user_id from the checkout session / subscription metadata."""
from types import SimpleNamespace

import pytest

from tests.conftest import USER_A


def make_subscription(sub_id="sub_A", user_id=None):
    price = SimpleNamespace(id="price_1", product="prod_1")
    return SimpleNamespace(
        id=sub_id, customer="cus_A", status="trialing", cancel_at_period_end=False,
        trial_end=None, current_period_end=1_800_000_000, metadata={"user_id": user_id} if user_id else {},
        items=SimpleNamespace(data=[SimpleNamespace(price=price)]),
    )


@pytest.fixture()
def webhook(server_module, monkeypatch):
    state = {"event": None, "sub": make_subscription()}
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(server_module, "STRIPE_WEBHOOK_SECRET", "whsec_dummy")

    class WebhookStub:
        @staticmethod
        def construct_event(payload, sig, secret):
            return state["event"]

    class SubscriptionStub:
        @staticmethod
        def retrieve(sub_id, expand=None):
            return state["sub"]

    monkeypatch.setattr(server_module.stripe, "Webhook", WebhookStub)
    monkeypatch.setattr(server_module.stripe, "Subscription", SubscriptionStub)

    def send(client, event_type, obj):
        state["event"] = {"id": "evt_1", "type": event_type, "data": {"object": obj}}
        return client.post("/api/billing/webhook", content=b"{}", headers={"stripe-signature": "sig"})
    state["send"] = send
    return state


def test_checkout_completed_binds_user_id_from_client_reference_id(client, fake_db, webhook):
    session = SimpleNamespace(id="cs_1", mode="subscription", subscription="sub_A", client_reference_id=USER_A,
                              customer_details=SimpleNamespace(email="buyer@example.com"), customer_email=None)
    res = webhook["send"](client, "checkout.session.completed", session)
    assert res.status_code == 200
    row = fake_db.store["billing_subscriptions"][0]
    assert row["user_id"] == USER_A and row["customer_email"] == "buyer@example.com" and row["stripe_subscription_id"] == "sub_A"


def test_subscription_events_bind_user_id_from_metadata(client, fake_db, webhook):
    res = webhook["send"](client, "customer.subscription.updated", make_subscription(user_id=USER_A))
    assert res.status_code == 200
    assert fake_db.store["billing_subscriptions"][0]["user_id"] == USER_A


def test_guest_checkout_leaves_user_id_unset(client, fake_db, webhook):
    session = SimpleNamespace(id="cs_1", mode="subscription", subscription="sub_A", client_reference_id=None,
                              customer_details=SimpleNamespace(email="buyer@example.com"), customer_email=None)
    webhook["send"](client, "checkout.session.completed", session)
    assert fake_db.store["billing_subscriptions"][0].get("user_id") is None


def test_checkout_session_stamps_user_id_when_signed_in(client, server_module, monkeypatch):
    from tests.conftest import TOKEN_A, auth
    created = {}

    class SessionStub:
        @staticmethod
        def create(**kwargs):
            created.update(kwargs)
            return SimpleNamespace(id="cs_1", url="https://checkout.stripe.com/x")
    monkeypatch.setattr(server_module, "STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(server_module, "STRIPE_PRICE_ID", "price_1")
    monkeypatch.setattr(server_module.stripe.checkout, "Session", SessionStub)

    res = client.post("/api/billing/checkout-session", json={"email": "buyer@example.com"}, headers=auth(TOKEN_A))
    assert res.status_code == 200
    assert created["client_reference_id"] == USER_A
    assert created["subscription_data"]["metadata"]["user_id"] == USER_A
    assert created["metadata"]["user_id"] == USER_A

    created.clear()
    res = client.post("/api/billing/checkout-session", json={"email": "buyer@example.com"})   # guest
    assert res.status_code == 200 and created["client_reference_id"] is None
