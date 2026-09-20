"""Shared test fixtures for backend API tests.

The backend module creates a Supabase client at import time, so we point it at
dummy credentials and then swap in an in-memory fake that mimics the small
subset of the PostgREST query builder the server uses. No network access.
"""
import copy
import importlib
import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("AUTH_USER_CACHE_TTL_SECONDS", "0")


# --- Fake Supabase -----------------------------------------------------------

class FakeResponse:
    def __init__(self, data):
        self.data = data
        self.error = None


class FakeQuery:
    def __init__(self, store, table):
        self._store = store
        self._table = table
        self._filters = []
        self._op = "select"
        self._payload = None
        self._on_conflict = None

    # builders
    def select(self, *_columns):
        self._op = "select"
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def upsert(self, payload, on_conflict=None):
        self._op = "upsert"
        self._payload = payload
        self._on_conflict = on_conflict
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def delete(self):
        self._op = "delete"
        return self

    def eq(self, column, value):
        self._filters.append((column, value))
        return self

    def ilike(self, column, pattern):
        self._filters.append((column, ("ilike", pattern)))
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args):
        return self

    # execution
    def _rows(self):
        return self._store.setdefault(self._table, [])

    def _matches(self, row):
        for col, val in self._filters:
            if isinstance(val, tuple) and val[0] == "ilike":
                if str(row.get(col) or "").lower() != val[1].lower():
                    return False
            elif row.get(col) != val:
                return False
        return True

    def execute(self):
        rows = self._rows()
        if self._op == "select":
            return FakeResponse([copy.deepcopy(r) for r in rows if self._matches(r)])
        if self._op == "insert":
            doc = dict(self._payload)
            doc.setdefault("id", f"row-{len(rows) + 1}")
            doc.setdefault("created_at", "2026-01-01T00:00:00+00:00")
            rows.append(doc)
            return FakeResponse([copy.deepcopy(doc)])
        if self._op == "upsert":
            doc = dict(self._payload)
            keys = [k.strip() for k in (self._on_conflict or "id").split(",")]
            for existing in rows:
                if all(existing.get(k) == doc.get(k) for k in keys):
                    existing.update(doc)
                    return FakeResponse([copy.deepcopy(existing)])
            rows.append(doc)
            return FakeResponse([copy.deepcopy(doc)])
        if self._op == "update":
            updated = []
            for row in rows:
                if self._matches(row):
                    row.update(self._payload)
                    updated.append(copy.deepcopy(row))
            return FakeResponse(updated)
        if self._op == "delete":
            kept = [r for r in rows if not self._matches(r)]
            removed = [r for r in rows if self._matches(r)]
            rows[:] = kept
            return FakeResponse(removed)
        raise AssertionError(f"unsupported op {self._op}")


class FakeAuthAdmin:
    def __init__(self):
        self.deleted_users = []
        self.fail = False

    def delete_user(self, user_id):
        if self.fail:
            raise Exception("auth admin unavailable")
        self.deleted_users.append(user_id)


class FakeAuth:
    """Maps access tokens -> user ids. Anything else is an invalid token."""

    def __init__(self, tokens, emails=None):
        self.tokens = dict(tokens)
        self.emails = dict(emails or {})
        self.calls = []
        self.admin = FakeAuthAdmin()

    def get_user(self, token):
        self.calls.append(token)
        if token not in self.tokens:
            raise Exception("invalid JWT")  # mirrors gotrue AuthApiError
        user_id = self.tokens[token]
        return SimpleNamespace(
            user=SimpleNamespace(id=user_id, email=self.emails.get(user_id), created_at="2026-01-01T00:00:00+00:00", is_anonymous=False)
        )


class FakeSupabase:
    def __init__(self, tokens, emails=None):
        self.store = {}
        self.auth = FakeAuth(tokens, emails)

    def table(self, name):
        return FakeQuery(self.store, name)


# --- Fixtures -----------------------------------------------------------------

USER_A = "11111111-1111-1111-1111-111111111111"
USER_B = "22222222-2222-2222-2222-222222222222"
TOKEN_A = "token-for-user-a"
TOKEN_B = "token-for-user-b"
EMAIL_A = "UserA@example.com"
EMAIL_B = "userb@example.com"


@pytest.fixture()
def server_module(monkeypatch):
    import server  # noqa: WPS433 (import after env setup)

    importlib.reload(server)
    fake = FakeSupabase({TOKEN_A: USER_A, TOKEN_B: USER_B}, {USER_A: EMAIL_A, USER_B: EMAIL_B})
    monkeypatch.setattr(server, "supabase", fake)
    getattr(server, "_verified_user_cache", {}).clear()
    return server


@pytest.fixture()
def client(server_module):
    from fastapi.testclient import TestClient

    return TestClient(server_module.app)


@pytest.fixture()
def fake_db(server_module):
    return server_module.supabase


def auth(token):
    return {"Authorization": f"Bearer {token}"}
