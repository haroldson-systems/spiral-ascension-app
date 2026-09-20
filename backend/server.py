from fastapi import FastAPI, APIRouter, HTTPException, Request, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional
import time
import uuid
from datetime import datetime, timezone, timedelta, date
from supabase import create_client, Client
from postgrest.exceptions import APIError as PostgrestAPIError
import stripe


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.environ.get('ADMIN_EMAILS', '').split(',')
    if email.strip()
}
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID')
STRIPE_PRODUCT_ID = os.environ.get('STRIPE_PRODUCT_ID')
FRONTEND_URL = os.environ.get('FRONTEND_URL')
STRIPE_TRIAL_DAYS = int(os.environ.get('STRIPE_TRIAL_DAYS', '7'))
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_data(response):
    if hasattr(response, "error") and response.error:
        message = getattr(response.error, "message", str(response.error))
        raise HTTPException(status_code=500, detail=message)
    return response.data


def get_single_row(response):
    data = get_data(response) or []
    return data[0] if data else None


def is_missing_table_error(exc: Exception, table_name: str) -> bool:
    if not isinstance(exc, PostgrestAPIError):
        return False
    message = str(exc)
    return (
        "PGRST205" in message
        and (
            f"public.{table_name}" in message
            or f"'{table_name}'" in message
            or table_name in message
        )
    )


def content_tables_not_ready_error() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "Content tables are not provisioned yet. "
            "Run supabase_content_migration.sql in Supabase, then use Seed Defaults in the Control Room."
        ),
    )

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
SITE_SETTINGS_STATE = {
    "maintenanceMode": False,
}


# Define Models
class Practice(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    subtitle: Optional[str] = None
    category: str
    duration: str
    level: str
    image: str
    description: str

class PracticeVariant(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    parentId: str
    title: str
    sortDate: Optional[str] = None
    category: str
    duration: str
    level: str
    image: str
    description: str
    startLabel: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    kind: Optional[str] = None
    creator: Optional[str] = None
    externalUrl: Optional[str] = None
    tags: Optional[List[str]] = None
    mediaUrl: Optional[str] = None
    audioUrl: Optional[str] = None
    mediaType: Optional[str] = None
    supportState: Optional[str] = None
    frequency: Optional[str] = None
    credit: Optional[str] = None
    sourceUrl: Optional[str] = None

class SpiralModule(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    subtitle: Optional[str] = None
    image: Optional[str] = None
    image_feminine: Optional[str] = None
    image_masculine: Optional[str] = None
    description: str
    tier: Optional[int] = None


class MoonSyncSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    cycleMode: int = 12
    timezone: Optional[str] = None
    anchorDate: Optional[str] = None


class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    maintenanceMode: bool = False


class AdminAccessResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    authorized: bool = True
    email: Optional[str] = None
    via: str


class CheckoutSessionCreate(BaseModel):
    email: EmailStr
    successUrl: Optional[str] = None
    cancelUrl: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    url: str
    sessionId: str


class CheckoutSessionSummary(BaseModel):
    sessionId: str
    status: Optional[str] = None
    paymentStatus: Optional[str] = None
    customerEmail: Optional[str] = None
    customerId: Optional[str] = None
    subscriptionId: Optional[str] = None


class PortalSessionCreate(BaseModel):
    checkoutSessionId: str
    returnUrl: Optional[str] = None


class PortalSessionResponse(BaseModel):
    url: str


class AccountPortalSessionCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    returnUrl: Optional[str] = None


class BillingStatusResponse(BaseModel):
    hasCustomer: bool
    status: Optional[str] = None
    cancelAtPeriodEnd: bool = False
    trialEnd: Optional[str] = None
    currentPeriodEnd: Optional[str] = None
    paymentFailed: bool = False
    # True when a subscription matches the account email but is not yet bound to this user id
    # (legacy row awaiting the binding migration / manual link). UI shows "contact support".
    needsLinking: bool = False


class MoonSyncEventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    # Optional client-chosen id. `moonsync_events.id` is a uuid column, so anything
    # that is not a valid UUID is replaced server-side (see normalize_event_id).
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    eventType: str
    associatedPhase: str
    eventAt: str


class MoonSyncEventUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    description: Optional[str] = None
    eventType: str
    associatedPhase: str
    eventAt: str


# --- Authenticated user identity (Vault / MoonSync) ---
#
# User-scoped endpoints derive the user ID ONLY from a Supabase access token
# (Authorization: Bearer <jwt>) verified server-side via Supabase Auth. The
# legacy `x-moonsync-user` header is never trusted for scoping; if a client
# still sends it and it disagrees with the verified identity, the request is
# rejected so a mismatch can never silently touch another user's rows.

AUTH_USER_CACHE_TTL_SECONDS = int(os.environ.get("AUTH_USER_CACHE_TTL_SECONDS", "0"))
_verified_user_cache: dict = {}


def extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    bearer_prefix = "bearer "
    if not auth_header.lower().startswith(bearer_prefix):
        return ""
    return auth_header[len(bearer_prefix):].strip()


def verify_supabase_access_token(token: str) -> dict:
    """Return the verified identity {id, email, created_at, is_anonymous} for a valid
    Supabase access token, else raise 401.

    Verification is delegated to Supabase Auth (`auth.get_user`), which checks the
    signature, expiry AND whether the session still exists (sign-out / revocation).

    Caching is OFF by default (AUTH_USER_CACHE_TTL_SECONDS=0) so every request re-checks
    revocation. Setting a TTL trades one Supabase round-trip per request for a window in
    which a just-revoked token is still accepted for up to TTL seconds. Only enable it if
    latency becomes a problem and that window is acceptable.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    now = time.monotonic()
    cached = _verified_user_cache.get(token)
    if cached and cached[0] > now:
        return dict(cached[1])

    try:
        auth_response = supabase.auth.get_user(token)
    except Exception:
        logger.info("Rejected request: Supabase access token could not be verified")
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = getattr(auth_response, "user", None)
    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    identity = {
        "id": str(user_id),
        "email": getattr(user, "email", None) or None,
        "created_at": str(getattr(user, "created_at", "") or "") or None,
        "is_anonymous": bool(getattr(user, "is_anonymous", False)),
    }
    if AUTH_USER_CACHE_TTL_SECONDS > 0:
        if len(_verified_user_cache) > 5000:
            _verified_user_cache.clear()
        _verified_user_cache[token] = (now + AUTH_USER_CACHE_TTL_SECONDS, identity)
    return dict(identity)


def get_verified_identity(request: Request) -> dict:
    """Verified identity for user-scoped endpoints (never derived from client input)."""
    identity = verify_supabase_access_token(extract_bearer_token(request))

    legacy_header = request.headers.get("x-moonsync-user")
    if legacy_header and legacy_header.strip() != identity["id"]:
        logger.warning("Rejected request: x-moonsync-user header does not match verified user")
        raise HTTPException(status_code=403, detail="User identity mismatch")

    return identity


def get_current_user_id(request: Request) -> str:
    """FastAPI helper: the verified user ID for user-scoped endpoints."""
    return get_verified_identity(request)["id"]


def get_moonsync_user_id(request: Request) -> str:
    # Backwards-compatible name used by the MoonSync/Vault handlers.
    return get_current_user_id(request)


def ensure_moonsync_user_row(user_id: str) -> None:
    if not user_id:
        return
    try:
        supabase.table("users").upsert({"id": user_id}, on_conflict="id").execute()
    except Exception:
        logger.info("Failed to upsert users row for moonsync user")


def to_epoch_ms(value: datetime) -> int:
    return int(value.timestamp() * 1000)


def parse_anchor_date(value: Optional[str]) -> date:
    if not value:
        return datetime.now(timezone.utc).date()
    try:
        return date.fromisoformat(value)
    except ValueError:
        return datetime.now(timezone.utc).date()


def calculate_lunar_phases(anchor: date, year: int, cycle_mode: int = 12):
    # Approximate synodic month length in days for 12-month mode.
    cycle_days = 29.530588
    if cycle_mode == 13:
        # 13-month calendar uses fixed 28-day cycles.
        cycle_days = 28
    phase_days = cycle_days / 8

    # Anchor is treated as a new moon start (00:00 UTC).
    anchor_dt = datetime(anchor.year, anchor.month, anchor.day, tzinfo=timezone.utc)
    year_start = datetime(year, 1, 1, tzinfo=timezone.utc)
    year_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)

    # Find the most recent new moon at or before the year start.
    cycle_start = anchor_dt
    while cycle_start > year_start:
        cycle_start -= timedelta(days=cycle_days)
    while cycle_start + timedelta(days=cycle_days) < year_start:
        cycle_start += timedelta(days=cycle_days)

    phases = [
        "newMoon",
        "waxingCrescent",
        "firstQuarter",
        "waxingGibbous",
        "fullMoon",
        "waningGibbous",
        "lastQuarter",
        "waningCrescent",
    ]

    results = []
    current_start = cycle_start
    while current_start < year_end:
        for index, phase in enumerate(phases):
            start_at = current_start + timedelta(days=phase_days * index)
            end_at = start_at + timedelta(days=phase_days)
            if end_at < year_start:
                continue
            if start_at >= year_end:
                return results
            results.append(
                {
                    "phase": phase,
                    "startAtMs": to_epoch_ms(start_at),
                    "endAtMs": to_epoch_ms(end_at),
                }
            )
        current_start += timedelta(days=cycle_days)

    return results

def require_admin(request: Request) -> None:
    token = request.headers.get('x-admin-token')
    if ADMIN_TOKEN and token == ADMIN_TOKEN:
        return

    auth_header = request.headers.get("authorization", "")
    bearer_prefix = "bearer "
    jwt = auth_header[len(bearer_prefix):].strip() if auth_header.lower().startswith(bearer_prefix) else ""

    if jwt and ADMIN_EMAILS:
        try:
            auth_response = supabase.auth.get_user(jwt)
            user = getattr(auth_response, "user", None)
            email = getattr(user, "email", None)
            if email and email.strip().lower() in ADMIN_EMAILS:
                return
        except Exception:
            logger.info("Failed admin auth verification from bearer token")

    if not ADMIN_TOKEN and not ADMIN_EMAILS:
        raise HTTPException(status_code=401, detail="Admin auth is not configured")

    raise HTTPException(status_code=401, detail="Unauthorized")


def get_frontend_base_url(request: Request) -> str:
    origin = request.headers.get("origin")
    if origin and origin.startswith("http"):
        return origin.rstrip("/")
    if FRONTEND_URL:
        return FRONTEND_URL.rstrip("/")
    referer = request.headers.get("referer")
    if referer and referer.startswith("http"):
        return referer.split("/api", 1)[0].rstrip("/")
    return "http://localhost:5173"


def ensure_stripe_configured() -> None:
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        raise HTTPException(status_code=503, detail="Stripe is not configured")
    stripe.api_key = STRIPE_SECRET_KEY


def ensure_stripe_webhook_configured() -> None:
    if not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured")
    stripe.api_key = STRIPE_SECRET_KEY


def iso_from_stripe_timestamp(value) -> Optional[str]:
    if value is None:
        return None
    try:
        ts = int(value)
    except (TypeError, ValueError):
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def upsert_billing_subscription(doc: dict) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    row = {**doc, "updated_at": now_iso}
    try:
        get_data(
            supabase.table("billing_subscriptions")
            .upsert(row, on_conflict="stripe_subscription_id")
            .execute()
        )
    except PostgrestAPIError as exc:
        # billing_subscriptions.user_id is added by supabase_billing_user_binding_migration.sql.
        # Until it runs, keep writing the rest of the snapshot rather than dropping the event.
        if "user_id" in row and "PGRST204" in str(exc) and "user_id" in str(exc):
            logger.error("billing_subscriptions.user_id column missing – run supabase_billing_user_binding_migration.sql")
            row.pop("user_id")
            get_data(
                supabase.table("billing_subscriptions")
                .upsert(row, on_conflict="stripe_subscription_id")
                .execute()
            )
        else:
            raise


def _subscription_metadata_as_dict(metadata) -> dict:
    if not metadata:
        return {}
    if isinstance(metadata, dict):
        return dict(metadata)
    try:
        return dict(metadata)
    except (TypeError, ValueError):
        return {}


def build_billing_subscription_doc(
    subscription,
    customer_email: Optional[str] = None,
    checkout_session_id: Optional[str] = None,
) -> dict:
    price_id = None
    product_id = None
    items = getattr(subscription, "items", None)
    item_list = getattr(items, "data", None) if items is not None else None
    if item_list and len(item_list) > 0:
        price = getattr(item_list[0], "price", None)
        if price is not None:
            if isinstance(price, str):
                price_id = price
            else:
                price_id = getattr(price, "id", None)
                product_id = extract_stripe_id(getattr(price, "product", None))

    doc = {
        "stripe_subscription_id": getattr(subscription, "id", None),
        "stripe_customer_id": extract_stripe_id(getattr(subscription, "customer", None)),
        "stripe_price_id": price_id,
        "stripe_product_id": product_id,
        "status": getattr(subscription, "status", None) or "incomplete",
        "cancel_at_period_end": bool(getattr(subscription, "cancel_at_period_end", False)),
        "trial_end": iso_from_stripe_timestamp(getattr(subscription, "trial_end", None)),
        "current_period_end": iso_from_stripe_timestamp(
            getattr(subscription, "current_period_end", None)
        ),
        "metadata": _subscription_metadata_as_dict(getattr(subscription, "metadata", None)),
    }
    if customer_email is not None:
        doc["customer_email"] = customer_email
    if checkout_session_id is not None:
        doc["checkout_session_id"] = checkout_session_id
    metadata_user_id = (doc["metadata"] or {}).get("user_id")
    if metadata_user_id:
        doc["user_id"] = str(metadata_user_id)
    return doc


def extract_stripe_id(value) -> Optional[str]:
    if not value:
        return None
    if isinstance(value, str):
        return value
    return getattr(value, "id", None)


@api_router.get("/site-settings", response_model=SiteSettings)
async def get_site_settings():
    return SiteSettings(**SITE_SETTINGS_STATE)


@api_router.post("/site-settings", response_model=SiteSettings)
async def update_site_settings(payload: SiteSettings, request: Request):
    require_admin(request)
    SITE_SETTINGS_STATE["maintenanceMode"] = payload.maintenanceMode
    return SiteSettings(**SITE_SETTINGS_STATE)


@api_router.get("/admin/access", response_model=AdminAccessResponse)
async def get_admin_access(request: Request):
    require_admin(request)
    auth_header = request.headers.get("authorization", "")
    bearer_prefix = "bearer "
    jwt = auth_header[len(bearer_prefix):].strip() if auth_header.lower().startswith(bearer_prefix) else ""

    email = None
    via = "token"
    if jwt and ADMIN_EMAILS:
        try:
            auth_response = supabase.auth.get_user(jwt)
            user = getattr(auth_response, "user", None)
            verified_email = getattr(user, "email", None)
            if verified_email and verified_email.strip().lower() in ADMIN_EMAILS:
                email = verified_email.strip().lower()
                via = "session"
        except Exception:
            logger.info("Failed to include verified admin email in admin access response")

    return AdminAccessResponse(authorized=True, email=email, via=via)


@api_router.post("/billing/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(payload: CheckoutSessionCreate, request: Request):
    ensure_stripe_configured()
    base_url = get_frontend_base_url(request)

    # Durable ownership: if the buyer is signed in, stamp the Supabase user id on the checkout
    # session and the subscription so billing rows can be bound to user_id (not just email).
    bound_user_id: Optional[str] = None
    token = extract_bearer_token(request)
    if token:
        try:
            bound_user_id = verify_supabase_access_token(token)["id"]
        except HTTPException:
            bound_user_id = None  # expired token → proceed as guest checkout
    success_url = payload.successUrl or f"{base_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = payload.cancelUrl or f"{base_url}/billing/cancel"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[
                {
                    "price": STRIPE_PRICE_ID,
                    "quantity": 1,
                }
            ],
            customer_email=payload.email,
            success_url=success_url,
            cancel_url=cancel_url,
            allow_promotion_codes=True,
            billing_address_collection="auto",
            client_reference_id=bound_user_id,
            subscription_data={
                "trial_period_days": STRIPE_TRIAL_DAYS,
                "metadata": {"user_id": bound_user_id or ""},
            },
            metadata={
                "product_id": STRIPE_PRODUCT_ID or "",
                "user_id": bound_user_id or "",
            },
        )
    except Exception as exc:
        logger.exception("Failed to create Stripe checkout session")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not session.url:
        raise HTTPException(status_code=500, detail="Stripe checkout session did not return a URL")

    return CheckoutSessionResponse(url=session.url, sessionId=session.id)


@api_router.get("/billing/checkout-session/{session_id}", response_model=CheckoutSessionSummary)
async def get_checkout_session(session_id: str):
    ensure_stripe_configured()
    try:
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=["customer", "subscription"],
        )
    except Exception as exc:
        logger.exception("Failed to retrieve Stripe checkout session")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return CheckoutSessionSummary(
        sessionId=session.id,
        status=getattr(session, "status", None),
        paymentStatus=getattr(session, "payment_status", None),
        customerEmail=getattr(session, "customer_email", None),
        customerId=extract_stripe_id(getattr(session, "customer", None)),
        subscriptionId=extract_stripe_id(getattr(session, "subscription", None)),
    )


@api_router.post("/billing/portal-session", response_model=PortalSessionResponse)
async def create_portal_session(payload: PortalSessionCreate, request: Request):
    ensure_stripe_configured()
    base_url = get_frontend_base_url(request)
    return_url = payload.returnUrl or f"{base_url}/"

    try:
        checkout_session = stripe.checkout.Session.retrieve(
            payload.checkoutSessionId,
            expand=["customer"],
        )
        customer_id = extract_stripe_id(getattr(checkout_session, "customer", None))
        if not customer_id:
            raise HTTPException(status_code=400, detail="Checkout session has no customer")

        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create Stripe billing portal session")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return PortalSessionResponse(url=portal_session.url)


# --- Billing: signed-in portal access + status -----------------------------------

def _billing_row_for_identity(identity: dict) -> Optional[dict]:
    """Most recent billing snapshot BOUND to the verified user id (never matched by email)."""
    rows = _billing_rows_bound_to_user(identity["id"])
    if not rows:
        return None
    rows.sort(key=lambda r: r.get("updated_at") or "", reverse=True)
    with_customer = [r for r in rows if r.get("stripe_customer_id")]
    return (with_customer or rows)[0]


@api_router.get("/billing/status", response_model=BillingStatusResponse)
async def get_billing_status(request: Request):
    """Subscription state for the signed-in user (used by the account page + access gate)."""
    identity = get_verified_identity(request)
    row = _billing_row_for_identity(identity)
    needs_linking = bool(_billing_rows_matching_email_unbound(identity.get("email")))
    if not row:
        return BillingStatusResponse(hasCustomer=False, needsLinking=needs_linking)
    metadata = row.get("metadata") or {}
    return BillingStatusResponse(
        needsLinking=needs_linking,
        hasCustomer=bool(row.get("stripe_customer_id")),
        status=row.get("status"),
        cancelAtPeriodEnd=bool(row.get("cancel_at_period_end")),
        trialEnd=row.get("trial_end"),
        currentPeriodEnd=row.get("current_period_end"),
        paymentFailed=bool(metadata.get("last_payment_failed_at")) and (row.get("status") in ("past_due", "unpaid")),
    )


@api_router.post("/billing/portal", response_model=PortalSessionResponse)
async def create_account_portal_session(payload: AccountPortalSessionCreate, request: Request):
    """Open the Stripe customer portal for the signed-in user.

    Authorization is the verified Supabase session; the Stripe customer is the one stored
    against that user's billing snapshot. An email in the request body is never accepted.
    """
    identity = get_verified_identity(request)
    ensure_stripe_configured()

    row = _billing_row_for_identity(identity)
    customer_id = row.get("stripe_customer_id") if row else None
    if not customer_id:
        if _billing_rows_matching_email_unbound(identity.get("email")):
            raise HTTPException(
                status_code=409,
                detail="A subscription matches your email but is not linked to this account yet. Contact support to link it.",
            )
        raise HTTPException(status_code=404, detail="No subscription is linked to this account yet.")

    base_url = get_frontend_base_url(request)
    return_url = payload.returnUrl or f"{base_url}/account"
    if not return_url.startswith(base_url):
        return_url = f"{base_url}/account"

    try:
        portal_session = stripe.billing_portal.Session.create(customer=customer_id, return_url=return_url)
    except Exception as exc:
        logger.exception("Failed to create billing portal session for user %s", identity["id"][:8])
        raise HTTPException(status_code=502, detail="Could not open the billing portal. Please try again.") from exc

    logger.info("Billing portal opened user=%s customer=%s", identity["id"][:8], customer_id)
    return PortalSessionResponse(url=portal_session.url)


# --- Billing: Stripe webhook (idempotent) -----------------------------------------

WEBHOOK_EVENTS_TABLE = "billing_webhook_events"


def claim_webhook_event(event_id: str, event_type: str) -> bool:
    """Record the Stripe event id. Returns False if it was already processed.

    Requires the `billing_webhook_events` table (supabase_billing_webhook_events_migration.sql).
    The table is a release requirement: if it is missing the webhook answers 503 so Stripe retries
    and the failure is visible in the Stripe Dashboard, rather than silently processing duplicates.
    """
    try:
        supabase.table(WEBHOOK_EVENTS_TABLE).insert(
            {
                "event_id": event_id,
                "event_type": event_type,
                "received_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
        return True
    except PostgrestAPIError as exc:
        message = str(exc)
        if "23505" in message or "duplicate key" in message.lower():
            return False
        if is_missing_table_error(exc, WEBHOOK_EVENTS_TABLE):
            # Fail closed: without the dedupe table we cannot guarantee idempotency, so answer 503
            # (Stripe retries with backoff) and make the missing migration loud instead of silent.
            logger.error(
                "billing_webhook_events table missing – run supabase_billing_webhook_events_migration.sql; "
                "webhook event %s rejected with 503 until then", event_id,
            )
            raise HTTPException(status_code=503, detail="Webhook idempotency table missing; migration required")
        raise


def release_webhook_event(event_id: str) -> None:
    try:
        supabase.table(WEBHOOK_EVENTS_TABLE).delete().eq("event_id", event_id).execute()
    except Exception:
        logger.info("Could not release webhook event claim %s", event_id)


def _refresh_subscription_row(
    subscription_id: str,
    extra_metadata: Optional[dict] = None,
    extra_user_id: Optional[str] = None,
    **doc_overrides,
) -> Optional[dict]:
    subscription = stripe.Subscription.retrieve(subscription_id, expand=["items.data.price"])
    doc = build_billing_subscription_doc(subscription, **doc_overrides)
    if extra_metadata:
        doc["metadata"] = {**doc.get("metadata", {}), **extra_metadata}
    if extra_user_id and not doc.get("user_id"):
        doc["user_id"] = extra_user_id
    if doc.get("stripe_subscription_id"):
        upsert_billing_subscription(doc)
    return doc


def _handle_stripe_event(event_type: str, data_object) -> Optional[str]:
    """Apply one Stripe event to billing_subscriptions. Returns a short outcome for logging."""
    if event_type == "checkout.session.completed":
        mode = getattr(data_object, "mode", None)
        subscription_id = extract_stripe_id(getattr(data_object, "subscription", None))
        if mode != "subscription" or not subscription_id:
            return "ignored (not a subscription checkout)"
        customer_details = getattr(data_object, "customer_details", None)
        session_email = getattr(customer_details, "email", None) if customer_details else None
        if not session_email:
            session_email = getattr(data_object, "customer_email", None)
        client_reference_id = getattr(data_object, "client_reference_id", None)
        _refresh_subscription_row(
            subscription_id,
            extra_user_id=str(client_reference_id) if client_reference_id else None,
            customer_email=session_email,
            checkout_session_id=getattr(data_object, "id", None),
        )
        return f"subscription {subscription_id} linked" + (f" user={str(client_reference_id)[:8]}" if client_reference_id else "")

    if event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        doc = build_billing_subscription_doc(data_object)
        if doc.get("stripe_subscription_id"):
            upsert_billing_subscription(doc)
            return f"subscription {doc['stripe_subscription_id']} -> {doc['status']}"
        return "ignored (no subscription id)"

    if event_type == "invoice.payment_failed":
        subscription_id = extract_stripe_id(getattr(data_object, "subscription", None))
        if not subscription_id:
            return "ignored (invoice without subscription)"
        attempt = getattr(data_object, "attempt_count", None)
        next_attempt = iso_from_stripe_timestamp(getattr(data_object, "next_payment_attempt", None))
        doc = _refresh_subscription_row(
            subscription_id,
            extra_metadata={
                "last_payment_failed_at": datetime.now(timezone.utc).isoformat(),
                "last_payment_attempt_count": attempt,
                "next_payment_attempt": next_attempt,
            },
        )
        # Stripe Smart Retries + dunning emails handle the customer contact (Dashboard setting).
        return f"payment failed for {subscription_id} (attempt {attempt}, next {next_attempt or 'none'}) -> {doc['status'] if doc else '?'}"

    if event_type in ("invoice.paid", "invoice.payment_succeeded"):
        subscription_id = extract_stripe_id(getattr(data_object, "subscription", None))
        if not subscription_id:
            return "ignored (invoice without subscription)"
        doc = _refresh_subscription_row(
            subscription_id,
            extra_metadata={"last_payment_failed_at": None, "last_payment_attempt_count": None, "next_payment_attempt": None},
        )
        return f"payment ok for {subscription_id} -> {doc['status'] if doc else '?'}"

    if event_type == "customer.subscription.trial_will_end":
        return "trial ending soon (no action)"

    return "unhandled"


@api_router.post("/billing/webhook")
async def billing_webhook(request: Request):
    ensure_stripe_webhook_configured()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as exc:
        if exc.__class__.__name__ == "SignatureVerificationError":
            logger.warning("Stripe webhook rejected: invalid signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        raise

    event_id = event["id"]
    event_type = event["type"]
    data_object = event["data"]["object"]

    if not claim_webhook_event(event_id, event_type):
        logger.info("Stripe webhook duplicate ignored event=%s type=%s", event_id, event_type)
        return {"received": True, "eventType": event_type, "duplicate": True}

    try:
        outcome = _handle_stripe_event(event_type, data_object)
    except HTTPException:
        release_webhook_event(event_id)
        raise
    except Exception:
        # Release the claim so Stripe's retry can reprocess, and answer 500 to trigger it.
        release_webhook_event(event_id)
        logger.exception("Stripe webhook processing failed event=%s type=%s", event_id, event_type)
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    logger.info("Stripe webhook processed event=%s type=%s outcome=%s", event_id, event_type, outcome)
    return {"received": True, "eventType": event_type, "outcome": outcome}


@api_router.get("/practices", response_model=List[Practice])
async def list_practices():
    try:
        response = supabase.table("practices").select("*").order("id", desc=False).execute()
        return get_data(response) or []
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practices"):
            return []
        raise

@api_router.get("/practices/{practice_id}", response_model=Practice)
async def get_practice(practice_id: str):
    response = (
        supabase.table("practices")
        .select("*")
        .eq("id", practice_id)
        .single()
        .execute()
    )
    data = get_data(response)
    if not data:
        raise HTTPException(status_code=404, detail="Practice not found")
    return data

@api_router.post("/practices", response_model=Practice)
async def upsert_practice(practice: Practice, request: Request):
    require_admin(request)
    doc = practice.model_dump()
    try:
        response = supabase.table("practices").upsert(doc, on_conflict="id").execute()
        data = get_data(response)
        return data[0] if data else practice
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practices"):
            raise content_tables_not_ready_error()
        raise

@api_router.post("/practices/bulk", response_model=List[Practice])
async def upsert_practices_bulk(practices: List[Practice], request: Request):
    require_admin(request)
    docs = [practice.model_dump() for practice in practices]
    try:
        response = supabase.table("practices").upsert(docs, on_conflict="id").execute()
        return get_data(response) or practices
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practices"):
            raise content_tables_not_ready_error()
        raise

@api_router.delete("/practices/{practice_id}")
async def delete_practice(practice_id: str, request: Request):
    require_admin(request)
    get_data(supabase.table("practice_variants").delete().eq("parentId", practice_id).execute())
    get_data(supabase.table("practices").delete().eq("id", practice_id).execute())
    return {"deleted": True}

@api_router.get("/practice-variants", response_model=List[PracticeVariant])
async def list_practice_variants(parentId: Optional[str] = Query(default=None)):
    try:
        query = supabase.table("practice_variants").select("*")
        if parentId:
            query = query.eq("parentId", parentId)
        response = query.execute()
        return get_data(response) or []
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practice_variants"):
            return []
        raise

@api_router.post("/practice-variants", response_model=PracticeVariant)
async def upsert_practice_variant(variant: PracticeVariant, request: Request):
    require_admin(request)
    doc = variant.model_dump()
    try:
        response = supabase.table("practice_variants").upsert(doc, on_conflict="id").execute()
        data = get_data(response)
        return data[0] if data else variant
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practice_variants"):
            raise content_tables_not_ready_error()
        raise

@api_router.post("/practice-variants/bulk", response_model=List[PracticeVariant])
async def upsert_practice_variants_bulk(variants: List[PracticeVariant], request: Request):
    require_admin(request)
    docs = [variant.model_dump() for variant in variants]
    try:
        response = supabase.table("practice_variants").upsert(docs, on_conflict="id").execute()
        return get_data(response) or variants
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "practice_variants"):
            raise content_tables_not_ready_error()
        raise

@api_router.delete("/practice-variants/{variant_id}")
async def delete_practice_variant(variant_id: str, request: Request):
    require_admin(request)
    get_data(supabase.table("practice_variants").delete().eq("id", variant_id).execute())
    return {"deleted": True}

@api_router.get("/spiral-modules", response_model=List[SpiralModule])
async def list_spiral_modules(tier: Optional[int] = Query(default=None)):
    try:
        query = supabase.table("spiral_modules").select("*")
        if tier is not None:
            query = query.eq("tier", tier)
        response = query.execute()
        return get_data(response) or []
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "spiral_modules"):
            return []  # Table may not exist yet; frontend uses local fallback
        return []  # Table may not exist yet; frontend uses local fallback

@api_router.get("/spiral-modules/{module_id}", response_model=SpiralModule)
async def get_spiral_module(module_id: str):
    response = (
        supabase.table("spiral_modules")
        .select("*")
        .eq("id", module_id)
        .single()
        .execute()
    )
    data = get_data(response)
    if not data:
        raise HTTPException(status_code=404, detail="Module not found")
    return data

@api_router.post("/spiral-modules", response_model=SpiralModule)
async def upsert_spiral_module(module: SpiralModule, request: Request):
    require_admin(request)
    doc = module.model_dump()
    try:
        response = supabase.table("spiral_modules").upsert(doc, on_conflict="id").execute()
        data = get_data(response)
        return data[0] if data else module
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "spiral_modules"):
            raise content_tables_not_ready_error()
        raise

@api_router.post("/spiral-modules/bulk", response_model=List[SpiralModule])
async def upsert_spiral_modules_bulk(modules: List[SpiralModule], request: Request):
    require_admin(request)
    docs = [module.model_dump() for module in modules]
    try:
        response = supabase.table("spiral_modules").upsert(docs, on_conflict="id").execute()
        return get_data(response) or modules
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "spiral_modules"):
            raise content_tables_not_ready_error()
        raise

@api_router.delete("/spiral-modules/{module_id}")
async def delete_spiral_module(module_id: str, request: Request):
    require_admin(request)
    get_data(supabase.table("spiral_modules").delete().eq("id", module_id).execute())
    return {"deleted": True}


# Lesson content from markdown files (bypasses Vite glob issues)
LESSONS_DIR = ROOT_DIR.parent / "frontend" / "lessons_formatted"
TIER_FILES = {1: "module1_initiate.md", 2: "module2_apprentice.md", 3: "module3_adept.md"}
MODULE_NUMBERS = {
    "mentalism": 1, "correspondence": 2, "vibration": 3, "polarity": 4,
    "rhythm": 5, "cause-effect": 6, "gender": 7,
}


def _normalize_lesson(content: str) -> str:
    import re
    out = content.replace("\u00a0", " ").replace("\r\n", "\n")
    out = re.sub(r"[ \t]+\n", "\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    # Collapse multiple spaces/tabs within lines (fixes weird horizontal gaps)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = out.strip()
    out = re.sub(
        r"(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^*]+?)\s*\*\*→",
        r"\1\n**→",
        out,
    )
    out = re.sub(
        r"^\s*(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)",
        lambda m: m.group(1).rstrip() + "  \n",
        out,
        flags=re.M,
    )
    out = re.sub(
        r"(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)",
        lambda m: m.group(1).rstrip() + "  \n",
        out,
    )
    return out


def _extract_module_section(content: str, module_number: int) -> str | None:
    import re
    # Match from MODULE N until next MODULE header or end of string
    pattern = (
        rf"(^#\s+\*\*MODULE\s+{module_number}(?:\s+—|:)[\s\S]*?)"
        rf"(?=^#\s+\*\*MODULE\s+\d+(?:\s+—|:)|\Z)"
    )
    m = re.search(pattern, content, re.M)
    return m.group(1).strip() if m else None


@api_router.get("/lessons/{tier}/{module_id}")
async def get_lesson_content(tier: int, module_id: str):
    """Return markdown content for a spiral lesson. module_id: mentalism, correspondence, etc."""
    if tier not in TIER_FILES:
        raise HTTPException(status_code=404, detail="Invalid tier")
    import re
    base_id = re.sub(r"-[23]$", "", module_id)
    module_number = MODULE_NUMBERS.get(base_id)
    if not module_number:
        raise HTTPException(status_code=404, detail="Unknown module")
    file_path = LESSONS_DIR / TIER_FILES[tier]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Lesson file not found")
    content = file_path.read_text(encoding="utf-8")
    normalized = _normalize_lesson(content)
    section = _extract_module_section(normalized, module_number)
    if not section:
        raise HTTPException(status_code=404, detail="Module section not found")
    return {"markdown": section, "tier": tier, "moduleNumber": module_number}


@api_router.get("/moonsync/settings", response_model=MoonSyncSettings)
async def get_moonsync_settings(request: Request):
    user_id = get_moonsync_user_id(request)
    response = (
        supabase.table("moonsync_settings")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = get_single_row(response)
    if not row:
        return MoonSyncSettings()
    return MoonSyncSettings(
        cycleMode=row.get("cycle_mode", 12),
        timezone=row.get("timezone"),
        anchorDate=row.get("anchor_date"),
    )


@api_router.post("/moonsync/settings", response_model=MoonSyncSettings)
async def upsert_moonsync_settings(payload: MoonSyncSettings, request: Request):
    user_id = get_moonsync_user_id(request)
    ensure_moonsync_user_row(user_id)
    doc = {
        "user_id": user_id,
        "cycle_mode": payload.cycleMode,
        "timezone": payload.timezone,
        "anchor_date": payload.anchorDate,
    }
    response = supabase.table("moonsync_settings").upsert(doc, on_conflict="user_id").execute()
    data = get_data(response)
    row = data[0] if data else doc
    return MoonSyncSettings(
        cycleMode=row.get("cycle_mode", payload.cycleMode),
        timezone=row.get("timezone"),
        anchorDate=row.get("anchor_date"),
    )


@api_router.get("/moonsync/events")
async def list_moonsync_events(request: Request):
    user_id = get_moonsync_user_id(request)
    response = (
        supabase.table("moonsync_events")
        .select("*")
        .eq("user_id", user_id)
        .order("event_at", desc=False)
        .execute()
    )
    data = get_data(response) or []
    return [
        {
            "id": row.get("id"),
            "title": row.get("title"),
            "description": row.get("description"),
            "eventType": row.get("event_type"),
            "associatedPhase": row.get("associated_phase"),
            "eventAt": row.get("event_at"),
        }
        for row in data
    ]


def is_valid_uuid(value: Optional[str]) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def normalize_event_id(client_id: Optional[str]) -> str:
    """`moonsync_events.id` is a Postgres uuid column.

    Older clients generated ids like `event_<timestamp>_<random>`; Postgres rejects those
    (22P02 invalid input syntax for type uuid) and the event was silently never saved.
    Accept a valid UUID from the client, otherwise mint one here.
    """
    if client_id and is_valid_uuid(client_id):
        return str(uuid.UUID(client_id))
    return str(uuid.uuid4())


@api_router.post("/moonsync/events")
async def create_moonsync_event(payload: MoonSyncEventIn, request: Request):
    user_id = get_moonsync_user_id(request)
    ensure_moonsync_user_row(user_id)
    event_id = normalize_event_id(payload.id)
    doc = {
        "id": event_id,
        "user_id": user_id,
        "title": payload.title,
        "description": payload.description,
        "event_type": payload.eventType,
        "associated_phase": payload.associatedPhase,
        "event_at": payload.eventAt,
    }
    response = supabase.table("moonsync_events").insert(doc).execute()
    _ = get_data(response)
    return {"ok": True, "id": event_id}


@api_router.put("/moonsync/events/{event_id}")
async def update_moonsync_event(event_id: str, payload: MoonSyncEventUpdate, request: Request):
    user_id = get_moonsync_user_id(request)
    if not is_valid_uuid(event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    doc = {
        "title": payload.title,
        "description": payload.description,
        "event_type": payload.eventType,
        "associated_phase": payload.associatedPhase,
        "event_at": payload.eventAt,
    }
    response = (
        supabase.table("moonsync_events")
        .update(doc)
        .eq("id", event_id)
        .eq("user_id", user_id)
        .execute()
    )
    _ = get_data(response)
    return {"ok": True}


@api_router.delete("/moonsync/events/{event_id}")
async def delete_moonsync_event(event_id: str, request: Request):
    user_id = get_moonsync_user_id(request)
    if not is_valid_uuid(event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    response = (
        supabase.table("moonsync_events")
        .delete()
        .eq("id", event_id)
        .eq("user_id", user_id)
        .execute()
    )
    _ = get_data(response)
    return {"ok": True}


# --- Vault ---
class SpiralNoteUpdate(BaseModel):
    content: str = ""


class VaultEntryCreate(BaseModel):
    content: str
    tags: List[str] = []
    type: str = "text"


@api_router.get("/vault/spiral-notes/{module_id}")
async def get_spiral_note(module_id: str, request: Request):
    try:
        user_id = get_moonsync_user_id(request)
        ensure_moonsync_user_row(user_id)
        response = (
            supabase.table("spiral_notes")
            .select("content")
            .eq("user_id", user_id)
            .eq("module_id", module_id)
            .limit(1)
            .execute()
        )
        row = get_single_row(response)
        return {"content": row["content"]} if row else {"content": ""}
    except PostgrestAPIError:
        return {"content": ""}  # spiral_notes table doesn't exist yet


@api_router.put("/vault/spiral-notes/{module_id}")
async def upsert_spiral_note(module_id: str, payload: SpiralNoteUpdate, request: Request):
    try:
        user_id = get_moonsync_user_id(request)
        ensure_moonsync_user_row(user_id)
        doc = {
            "user_id": user_id,
            "module_id": module_id,
            "content": payload.content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("spiral_notes").upsert(doc, on_conflict="user_id,module_id").execute()
        return {"ok": True}
    except PostgrestAPIError:
        return {"ok": False}  # Table may not exist yet; notes won't persist


@api_router.get("/vault/entries")
async def list_vault_entries(request: Request):
    user_id = get_moonsync_user_id(request)
    ensure_moonsync_user_row(user_id)
    response = (
        supabase.table("vault_entries")
        .select("id,content,tags,type,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    data = get_data(response) or []
    return [
        {
            "id": r["id"],
            "content": r["content"],
            "tags": r.get("tags") or [],
            "type": r.get("type") or "text",
            "created_at": r["created_at"],
        }
        for r in data
    ]


@api_router.post("/vault/entries")
async def create_vault_entry(payload: VaultEntryCreate, request: Request):
    user_id = get_moonsync_user_id(request)
    ensure_moonsync_user_row(user_id)
    doc = {
        "user_id": user_id,
        "content": payload.content,
        "tags": payload.tags,
        "type": payload.type,
    }
    response = supabase.table("vault_entries").insert(doc).execute()
    data = get_data(response)
    row = data[0] if data else None
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create entry")
    return {
        "id": row["id"],
        "content": row["content"],
        "tags": row.get("tags") or [],
        "type": row.get("type") or "text",
        "created_at": row["created_at"],
    }


@api_router.get("/moonsync/phases")
async def list_moonsync_phases(request: Request, year: Optional[int] = Query(default=None)):
    user_id = get_moonsync_user_id(request)
    response = (
        supabase.table("moonsync_settings")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = get_single_row(response)
    anchor_value = row.get("anchor_date") if row else None
    cycle_mode = row.get("cycle_mode", 12) if row else 12
    target_year = year or datetime.now(timezone.utc).year
    anchor = parse_anchor_date(anchor_value)
    return calculate_lunar_phases(anchor, target_year, cycle_mode)


# --- Account: export + deletion (Privacy Policy tools) ---
#
# Both endpoints act only on the identity verified from the Supabase access token.
# See ACCOUNT_DATA.md for the full inventory / retention table.
#
# Ownership of billing rows is by `billing_subscriptions.user_id` (bound at checkout via
# client_reference_id + subscription metadata, backfilled once by
# supabase_billing_user_binding_migration.sql). Email is NOT an ownership key: a legacy row that
# only matches by email blocks deletion (409) until it is bound, so we can never cancel someone
# else's subscription or delete data while an unbound subscription keeps charging.

ACCOUNT_DELETE_CONFIRMATION = "DELETE"
# Child tables keyed by user_id (deleted before the parent `users` row). `spiral_notes` exists only
# after the Vault hotfix migration; missing tables are skipped.
USER_OWNED_TABLES = ("vault_entries", "spiral_notes", "moonsync_events", "moonsync_settings")
# Tables keyed by id == auth user id.
USER_KEYED_TABLES = ("profiles", "users")
ACTIVE_SUBSCRIPTION_STATUSES = {"trialing", "active", "past_due", "unpaid", "incomplete", "paused"}


class AccountDeleteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    confirmation: str


def _rows_where(table: str, column: str, value: str) -> list:
    """All rows of `table` where column == value; [] if the table does not exist.

    Selects `*` on purpose: the export must include every column that exists in production,
    not just the ones the code happens to know about.
    """
    try:
        response = supabase.table(table).select("*").eq(column, value).execute()
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, table):
            return []
        raise
    return get_data(response) or []


def _strip_owner_columns(rows: list) -> list:
    return [{k: v for k, v in row.items() if k not in ("user_id",)} for row in rows]


def _billing_rows_bound_to_user(user_id: str) -> list:
    try:
        response = supabase.table("billing_subscriptions").select("*").eq("user_id", user_id).execute()
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "billing_subscriptions"):
            return []
        if "PGRST204" in str(exc) and "user_id" in str(exc):
            logger.error("billing_subscriptions.user_id column missing – run supabase_billing_user_binding_migration.sql")
            return []
        raise
    return get_data(response) or []


def _billing_rows_matching_email_unbound(email: Optional[str]) -> list:
    """Legacy rows that only match by email and have no user_id yet (need backfill)."""
    if not email:
        return []
    try:
        response = (
            supabase.table("billing_subscriptions")
            .select("*")
            .ilike("customer_email", email.strip())
            .execute()
        )
    except PostgrestAPIError as exc:
        if is_missing_table_error(exc, "billing_subscriptions"):
            return []
        raise
    return [r for r in (get_data(response) or []) if not r.get("user_id")]


def _public_billing_view(row: dict) -> dict:
    return {
        "status": row.get("status"),
        "cancelAtPeriodEnd": row.get("cancel_at_period_end"),
        "trialEnd": row.get("trial_end"),
        "currentPeriodEnd": row.get("current_period_end"),
        "updatedAt": row.get("updated_at"),
    }


@api_router.get("/account/export")
async def export_account_data(request: Request):
    """Everything Spiral Ascension stores for the signed-in user, as one JSON file."""
    identity = get_verified_identity(request)
    user_id = identity["id"]

    bound = _billing_rows_bound_to_user(user_id)
    unbound = _billing_rows_matching_email_unbound(identity.get("email"))

    export = {
        "exportVersion": 2,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "account": {
            "id": user_id,
            "email": identity.get("email"),
            "createdAt": identity.get("created_at"),
            "isAnonymous": identity.get("is_anonymous", False),
        },
        "profile": _rows_where("profiles", "id", user_id),
        "vault": {
            "entries": _strip_owner_columns(_rows_where("vault_entries", "user_id", user_id)),
            "spiralNotes": _strip_owner_columns(_rows_where("spiral_notes", "user_id", user_id)),
        },
        "moonsync": {
            "settings": _strip_owner_columns(_rows_where("moonsync_settings", "user_id", user_id)),
            "events": _strip_owner_columns(_rows_where("moonsync_events", "user_id", user_id)),
        },
        "billing": {
            "subscriptions": [_public_billing_view(r) for r in bound],
            "unlinkedSubscriptionsMatchingEmail": len(unbound),
            "note": "Payment details live in Stripe; use Manage billing to view invoices.",
        },
    }

    logger.info("Account export generated for user %s", user_id[:8])
    filename = f"spiral-ascension-export-{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
    return JSONResponse(
        content=jsonable_encoder(export),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _cancel_active_subscriptions(billing_rows: list, user_id: str) -> list:
    """Cancel every active Stripe subscription immediately.

    Idempotent: already-cancelled subscriptions count as done. If any cancellation fails after
    others succeeded, raises 502 reporting the partial result; the caller has not deleted
    anything yet, and a retry re-runs this step (successes are skipped by Stripe as already canceled).
    """
    active = [
        r for r in billing_rows
        if r.get("stripe_subscription_id") and (r.get("status") or "") in ACTIVE_SUBSCRIPTION_STATUSES
    ]
    if not active:
        return []
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="An active subscription exists but billing is not configured; account deletion aborted.",
        )
    stripe.api_key = STRIPE_SECRET_KEY

    cancelled: list = []
    for row in active:
        sub_id = row["stripe_subscription_id"]
        try:
            stripe.Subscription.cancel(sub_id)
            cancelled.append(sub_id)
        except Exception as exc:
            message = str(exc).lower()
            if "no such subscription" in message or "canceled" in message or "cancelled" in message:
                cancelled.append(sub_id)
                continue
            logger.exception(
                "Stripe cancellation failed during account deletion user=%s subscription=%s cancelled_so_far=%d",
                user_id[:8], sub_id, len(cancelled),
            )
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Could not cancel all subscriptions ({len(cancelled)} of {len(active)} cancelled). "
                    "Nothing was deleted – please try again; already-cancelled subscriptions stay cancelled."
                ),
            ) from exc
    return cancelled


def _anonymize_billing_rows(billing_rows: list) -> int:
    """Scrub PII from retained billing snapshots. Raises on any failure (deletion must not claim success)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    anonymized = 0
    for row in billing_rows:
        if not row.get("id"):
            continue
        response = (
            supabase.table("billing_subscriptions")
            .update(
                {
                    "customer_email": None,
                    "metadata": {**(row.get("metadata") or {}), "account_deleted_at": now_iso},
                    "updated_at": now_iso,
                }
            )
            .eq("id", row["id"])
            .execute()
        )
        updated = get_data(response) or []
        if not updated or updated[0].get("customer_email") is not None:
            raise RuntimeError(f"billing row {row['id']} was not anonymized")
        anonymized += 1
    return anonymized


@api_router.delete("/account")
async def delete_account(payload: AccountDeleteRequest, request: Request):
    """Permanently delete the signed-in user's account and owned data.

    Steps (each idempotent, so a failed request can simply be retried):
      1. cancel active Stripe subscriptions bound to the user      (fail → 502, nothing deleted)
      2. anonymize retained billing rows                            (fail → 500, nothing deleted)
      3. delete user-owned child rows (vault, notes, moonsync)      (fail → 500, subs already safe)
      4. delete profiles + users rows                               (fail → 500)
      5. delete the Supabase auth user                              (fail → 500, told to retry)
    """
    identity = get_verified_identity(request)
    user_id = identity["id"]

    if payload.confirmation.strip() != ACCOUNT_DELETE_CONFIRMATION:
        raise HTTPException(
            status_code=400,
            detail=f'Type {ACCOUNT_DELETE_CONFIRMATION} to confirm account deletion.',
        )

    # 0. Ownership check: an email-matched but unbound subscription is a stop sign.
    unbound = [
        r for r in _billing_rows_matching_email_unbound(identity.get("email"))
        if (r.get("status") or "") in ACTIVE_SUBSCRIPTION_STATUSES
    ]
    if unbound:
        logger.warning("Account deletion blocked: unbound active subscription for user %s", user_id[:8])
        raise HTTPException(
            status_code=409,
            detail=(
                "An active subscription matches your email but is not yet linked to this account. "
                "Contact support so it can be linked or cancelled before deletion."
            ),
        )

    billing_rows = _billing_rows_bound_to_user(user_id)

    # 1. Billing first: cancel anything that could keep charging.
    cancelled = _cancel_active_subscriptions(billing_rows, user_id)

    # 2. Scrub PII from retained billing snapshots before any data is removed.
    try:
        anonymized = _anonymize_billing_rows(billing_rows)
    except Exception as exc:
        logger.exception("Billing anonymization failed during account deletion user=%s", user_id[:8])
        raise HTTPException(
            status_code=500,
            detail="Could not anonymize billing records. Nothing else was deleted – please try again.",
        ) from exc

    # 3. User-owned child rows.
    removed: dict = {}
    for table in USER_OWNED_TABLES:
        try:
            response = supabase.table(table).delete().eq("user_id", user_id).execute()
            removed[table] = len(get_data(response) or [])
        except PostgrestAPIError as exc:
            if is_missing_table_error(exc, table):
                removed[table] = 0
                continue
            logger.exception("Failed deleting %s during account deletion", table)
            raise HTTPException(
                status_code=500,
                detail="Account deletion failed part-way (subscriptions are cancelled). Please try again.",
            ) from exc

    # 4. Rows keyed by the auth user id.
    for table in USER_KEYED_TABLES:
        try:
            response = supabase.table(table).delete().eq("id", user_id).execute()
            removed[table] = len(get_data(response) or [])
        except PostgrestAPIError as exc:
            if is_missing_table_error(exc, table):
                removed[table] = 0
                continue
            logger.exception("Failed deleting %s during account deletion", table)
            raise HTTPException(
                status_code=500,
                detail="Account deletion failed part-way (subscriptions are cancelled). Please try again.",
            ) from exc

    # 5. The auth account itself.
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as exc:
        logger.exception("Failed deleting auth user during account deletion")
        raise HTTPException(
            status_code=500,
            detail="Your data was removed but the sign-in account could not be deleted yet. Please try again.",
        ) from exc

    logger.info(
        "Account deleted: user=%s rows=%s subscriptions_cancelled=%d billing_rows_anonymized=%d",
        user_id[:8], removed, len(cancelled), anonymized,
    )
    return {
        "deleted": True,
        "removed": removed,
        "subscriptionsCancelled": len(cancelled),
        "billingRecordsAnonymized": anonymized,
    }


# Include the router in the main app
app.include_router(api_router)

cors_env = os.environ.get('CORS_ORIGINS', '')
default_origins = {
    "https://thespiralascension.com",
    "https://www.thespiralascension.com",
}
allow_origins = {origin.strip() for origin in cors_env.split(',') if origin.strip()}
allow_origins = allow_origins or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=sorted(allow_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
