from fastapi import FastAPI, APIRouter, HTTPException, Request, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
from supabase import create_client, Client
from postgrest.exceptions import APIError as PostgrestAPIError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')

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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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
    category: str
    duration: str
    level: str
    image: str
    description: str
    startLabel: str
    kind: Optional[str] = None
    creator: Optional[str] = None
    externalUrl: Optional[str] = None
    tags: Optional[List[str]] = None
    mediaUrl: Optional[str] = None
    audioUrl: Optional[str] = None

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


class MoonSyncEventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
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


def get_moonsync_user_id(request: Request) -> str:
    user_id = request.headers.get("x-moonsync-user")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing x-moonsync-user header")
    return user_id


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
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Admin token not configured")
    token = request.headers.get('x-admin-token')
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    # Convert to dict and serialize datetime to ISO string for Supabase
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()

    response = supabase.table("status_checks").insert(doc).execute()
    _ = get_data(response)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    response = supabase.table("status_checks").select("*").order("timestamp", desc=True).execute()
    status_checks = get_data(response) or []

    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.get("/practices", response_model=List[Practice])
async def list_practices():
    response = supabase.table("practices").select("*").order("id", desc=False).execute()
    return get_data(response) or []

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
    response = supabase.table("practices").upsert(doc, on_conflict="id").execute()
    data = get_data(response)
    return data[0] if data else practice

@api_router.post("/practices/bulk", response_model=List[Practice])
async def upsert_practices_bulk(practices: List[Practice], request: Request):
    require_admin(request)
    docs = [practice.model_dump() for practice in practices]
    response = supabase.table("practices").upsert(docs, on_conflict="id").execute()
    return get_data(response) or practices

@api_router.delete("/practices/{practice_id}")
async def delete_practice(practice_id: str, request: Request):
    require_admin(request)
    get_data(supabase.table("practice_variants").delete().eq("parentId", practice_id).execute())
    get_data(supabase.table("practices").delete().eq("id", practice_id).execute())
    return {"deleted": True}

@api_router.get("/practice-variants", response_model=List[PracticeVariant])
async def list_practice_variants(parentId: Optional[str] = Query(default=None)):
    query = supabase.table("practice_variants").select("*")
    if parentId:
        query = query.eq("parentId", parentId)
    response = query.execute()
    return get_data(response) or []

@api_router.post("/practice-variants", response_model=PracticeVariant)
async def upsert_practice_variant(variant: PracticeVariant, request: Request):
    require_admin(request)
    doc = variant.model_dump()
    response = supabase.table("practice_variants").upsert(doc, on_conflict="id").execute()
    data = get_data(response)
    return data[0] if data else variant

@api_router.post("/practice-variants/bulk", response_model=List[PracticeVariant])
async def upsert_practice_variants_bulk(variants: List[PracticeVariant], request: Request):
    require_admin(request)
    docs = [variant.model_dump() for variant in variants]
    response = supabase.table("practice_variants").upsert(docs, on_conflict="id").execute()
    return get_data(response) or variants

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
    except PostgrestAPIError:
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
    response = supabase.table("spiral_modules").upsert(doc, on_conflict="id").execute()
    data = get_data(response)
    return data[0] if data else module

@api_router.post("/spiral-modules/bulk", response_model=List[SpiralModule])
async def upsert_spiral_modules_bulk(modules: List[SpiralModule], request: Request):
    require_admin(request)
    docs = [module.model_dump() for module in modules]
    response = supabase.table("spiral_modules").upsert(docs, on_conflict="id").execute()
    return get_data(response) or modules

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


@api_router.post("/moonsync/events")
async def create_moonsync_event(payload: MoonSyncEventIn, request: Request):
    user_id = get_moonsync_user_id(request)
    ensure_moonsync_user_row(user_id)
    doc = {
        "id": payload.id,
        "user_id": user_id,
        "title": payload.title,
        "description": payload.description,
        "event_type": payload.eventType,
        "associated_phase": payload.associatedPhase,
        "event_at": payload.eventAt,
    }
    response = supabase.table("moonsync_events").insert(doc).execute()
    _ = get_data(response)
    return {"ok": True}


@api_router.put("/moonsync/events/{event_id}")
async def update_moonsync_event(event_id: str, payload: MoonSyncEventUpdate, request: Request):
    user_id = get_moonsync_user_id(request)
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

# Include the router in the main app
app.include_router(api_router)

cors_env = os.environ.get('CORS_ORIGINS', '')
default_origins = {
    "http://127.0.0.1:3001",
    "http://localhost:3001",
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
