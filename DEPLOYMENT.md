# Deployment

## Recommended setup

- Frontend: Vercel
- Backend: Render
- Database: Supabase

This matches the current app architecture:

- `frontend` is a Vite app
- `backend` is a FastAPI service
- Supabase stores the app data

## Vercel frontend

Create a new Vercel project from this repo and set:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Add this environment variable in Vercel:

- `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`

The `frontend/vercel.json` file already adds the SPA rewrite needed for React Router.

## Render backend

Create a new Render Web Service from this repo, or use the included `render.yaml`.

Render service settings:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

Add these environment variables in Render:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN`
- `CORS_ORIGINS`

For `CORS_ORIGINS`, use your Vercel site URL, for example:

```text
https://your-site.vercel.app
```

If you later add a custom domain, update `CORS_ORIGINS` to include it. For multiple domains, separate them with commas:

```text
https://your-site.vercel.app,https://app.yourdomain.com
```

## Go live checklist

1. Deploy the backend on Render.
2. Copy the live Render URL.
3. Set `VITE_API_URL` in Vercel to `https://YOUR-RENDER-URL/api`.
4. Deploy the frontend on Vercel.
5. Add the Vercel URL to Render `CORS_ORIGINS`.
6. Open the deployed app and confirm:
   - Spiral paths load
   - lesson pages open
   - Vault notes save
   - MoonSync reads and writes successfully

## Notes

- The backend uses `SUPABASE_SERVICE_ROLE_KEY`, so it must stay server-side.
- Do not put Supabase service credentials in Vercel frontend env vars.
