# Sovereign Spiral

## Quick start — run the app

From the **project root** (the `spiral-ascension-app` folder):

```bash
npm install
npm run dev
```

That starts both the frontend (http://127.0.0.1:3001) and backend. Open the URL in your browser.

---

## First-time setup

If `npm run dev` fails, do this once:

**1. Install root dependencies**
```bash
npm install
```

**2. Install frontend dependencies**
```bash
cd frontend && npm install && cd ..
```

**3. Set up the backend (Python)**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**4. Add `.env` files** (if you have them — Supabase, etc.)

---

## Regenerating lessons (breath work formatting)

If you edit the raw lesson files in `frontend/lessons_raw/`:

```bash
cd frontend
python3 automate_lessons.py
```
