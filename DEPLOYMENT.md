# TaskPilot — Live Deployment Guide

Goal: make `https://taskpilotdemo.netlify.app` log in for real (demo credentials),
exactly like local. The frontend is already on Netlify; what's missing is a hosted
backend + database for it to talk to.

```
Netlify (client/ SPA)  --VITE_API_URL-->  Railway (server/ Express)  -->  Railway Postgres
```

Login failed on the live site for two reasons, both fixed in this branch:
1. The frontend had no backend to call (it fell back to `localhost:5000`).
2. The deployed bundle was stale (missing the "Demo credentials" box).

> **First: commit & push these changes.** Both Railway and Netlify build from the
> repo, so they need the new `server/railway.toml`, the cookie/CORS fixes, and
> `client/public/_redirects`. Push to the branch your Netlify **production** deploy
> tracks (usually `main`).

---

## Part A — Backend + database on Railway

1. **Create the project** — railway.app → *New Project* → *Deploy from GitHub repo* →
   pick this repo.
2. **Add the database** — in the project, *New* → *Database* → *Add PostgreSQL*.
   This creates `DATABASE_URL`.
3. **Configure the API service** — open the service Railway created from the repo:
   - **Settings → Root Directory** = `server`  (so it reads `server/railway.toml`).
   - **Settings → Networking → Generate Domain** → copy the URL, e.g.
     `https://taskpilot-api-production.up.railway.app`. You'll need it in Part B.
4. **Set environment variables** (service → *Variables*):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}`  ← reference the Postgres plugin |
   | `JWT_ACCESS_SECRET` | `F2mpAGRN0xLzGAVxVcMjVeW-jQRPd6qgMEMMTVj-Vwoc7l1Iq6vDKsmY7DGcm0bU` |
   | `JWT_REFRESH_SECRET` | `gPyhNhSz0Pt67nOj3SgqqFRavALCcyam3GWqumpR7D2YQpPEQ2QpX6QYcLHuNET8` |
   | `JWT_ACCESS_EXPIRY` | `15m` |
   | `JWT_REFRESH_EXPIRY` | `7d` |
   | `CLIENT_URL` | `https://taskpilotdemo.netlify.app` |
   | `APP_URL` | `https://taskpilotdemo.netlify.app` |

   (The above secrets were generated for you. Regenerate any time with
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.)

5. **Deploy.** `server/railway.toml` drives the rest automatically:
   - build: `prisma generate && npm run build`
   - pre-deploy: `prisma db push` (creates all tables) + `npm run seed` (demo users)
   - start: `node dist/server.js`

6. **Verify the API is up** — open `https://<your-railway-domain>/api/health`.
   You should get `200`. (Test login:
   `curl -X POST https://<domain>/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@taskpilot.com","password":"admin123"}'`
   → should return an `accessToken`.)

---

## Part B — Point the Netlify frontend at the backend

1. **Netlify → Site configuration → Environment variables → Add a variable:**

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-railway-domain>/api` |

   ⚠️ Include the trailing **`/api`** — routes are mounted under `/api` and the
   client's axios `baseURL` is exactly this value
   (see [client/src/api/client.ts](client/src/api/client.ts#L3)).

2. **Confirm build settings** (Site configuration → Build & deploy) match the monorepo:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`

3. **Trigger a redeploy** — *Deploys → Trigger deploy → Clear cache and deploy site*.
   This rebuilds from current code (brings back the Demo-credentials box) and bakes
   in `VITE_API_URL` (Vite inlines env vars at build time, so a redeploy is required
   whenever you change it).

---

## Part C — Verify

Open `https://taskpilotdemo.netlify.app/login`:
- The "Demo credentials — click to fill" box appears.
- `admin@taskpilot.com` / `admin123` → logs in to the dashboard.
- Refresh the page → you stay logged in (cross-domain refresh-token cookie now works —
  it's `SameSite=None; Secure` in production).

### Demo logins (from the seed)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@taskpilot.com` | `admin123` |
| Manager | `vikram@taskpilot.com` | `demo123` |
| Member | `rahul@taskpilot.com` | `demo123` |

---

## What changed in the code (this branch)

- **`server/src/routes/auth.routes.ts`** — refresh-token cookie is `SameSite=None; Secure`
  in production so it's sent on cross-site requests (Netlify ↔ Railway). Stays `Lax` in
  local dev (http localhost). Without this, login works but the session drops after ~15 min.
- **`server/src/app.ts`** — CORS now allows any `*.netlify.app` origin (production site +
  deploy previews).
- **`server/railway.toml`** — build / DB-setup / start commands for Railway.
- **`server/package.json`** — added `engines.node >=20` and a `db:setup` script.
- **`client/public/_redirects`** — SPA fallback so deep links / refreshes don't 404.

## Notes & gotchas

- **Free tier cold starts:** Railway's free service sleeps when idle; the first request
  after a while takes a few seconds. Fine for a demo.
- **`prisma db push` vs migrations:** the schema drifted past the committed migration, so
  the deploy uses `db push` to match `schema.prisma` exactly. Switch to
  `prisma migrate deploy` once you regenerate migrations.
- **Optional `netlify.toml`** (only if you prefer config-as-code over the Netlify UI —
  verify it matches your current site settings before committing, or it can break the build):
  ```toml
  [build]
    base = "client"
    command = "npm run build"
    publish = "dist"     # relative to base → client/dist

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- **Admin app (`admin/`)** is a separate SPA on `:5174`. To put it live too, deploy it as a
  second Netlify site with its own `VITE_API_URL` pointing at the same Railway API. Not
  required for the main login fix.
