# Think Decision — Multi-Expert MCDM Decision Support System

A multi-expert, multi-criteria decision support platform. A creator defines a case (goal, criteria, alternatives), invites experts, each expert judges independently, and the system aggregates the results.

**Methods**: AHP (principal eigenvector, power method), Fuzzy AHP (Buckley's fuzzy geometric mean + centroid defuzzification), ANP (supermatrix with limit matrix, inner dependence among criteria, single cluster weight), Fuzzy ANP, and ISM (Interpretive Structural Modelling). MICMAC is available as a derived analysis on top of a completed ISM case, not a method you pick separately.

## Features

- **Multi-expert workflow** — a creator invites experts; each expert judges independently, blind to the others
- **5 MCDM methods** — AHP, Fuzzy AHP, ANP, Fuzzy ANP, ISM; MICMAC derived automatically from a finished ISM case
- **Automatic aggregation** — AIJ (weighted geometric mean of judgments) or AIP (weighted arithmetic mean of each expert's own priorities), selectable per result view; majority vote across experts for ISM
- **Consistency checking** — Consistency Ratio computed per expert per level (AHP/ANP), from the principal eigenvector; cross-expert consensus score for ISM
- **Results & ranking** — criteria weights, alternative scores, recommendations, sensitivity analysis (weight what-if re-ranking)
- **Analytics & audit log** — activity dashboard and an audit trail of who did what

## Project Structure

```
backend/              Node.js/Express + Supabase — REST API under /api/v1 (port 3000)
frontend/              React (no-build, Babel standalone) — DecideAI.html (port 8000)
supabase/migrations/   Database schema + incremental migrations, run in order
compose.yaml           Docker Compose stack (backend + frontend + Redis)
```

## Quick Start

Pick one. Both need the [database set up](#database-setup-fresh-supabase-project) first.

### Option A — Docker (recommended, any OS)

```bash
# 1. Fill in backend/.env (see Environment Variables below).
#    For Docker specifically, set REDIS_URL=redis://redis:6379 — that
#    hostname is the Redis container's service name inside the compose
#    network, not an external Redis instance you need to run yourself.
cp backend/.env.example backend/.env

# 2. Build and start everything.
docker compose up -d --build

# 3. Check it's healthy.
curl http://localhost:3000/health
```
Backend: `http://localhost:3000` · Frontend: `http://localhost:8000/DecideAI.html`

### Option B — Manual

Windows (PowerShell):
```powershell
.\start-all.ps1
```

Any OS:
```bash
# Backend
cd backend
npm install        # once
npm start           # http://localhost:3000  (health check: /health)

# Frontend (separate terminal)
cd frontend
python -m http.server 8000
# open http://localhost:8000/DecideAI.html
```
In manual/dev mode `REDIS_URL` can be left empty — it falls back to an in-memory refresh-token denylist. Docker mode runs with `NODE_ENV=production`, which requires `REDIS_URL` to be set (shared denylist across restarts).

## Database Setup (fresh Supabase project)

1. Create a new project at the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** in that project and run every file in `supabase/migrations/` **in filename order**, starting with `2025100100_initial_schema.sql` (creates the 13 core tables and seeds the methods registry). This full sequence has been tested end-to-end against a blank database — no manual patching needed.
3. Copy `backend/.env.example` to `backend/.env` and fill it in (see below).

## Environment Variables

All read from `backend/.env` (or `backend/.env.prod` for a separate production file — see the comment at the top of `compose.yaml`). Template: `backend/.env.example`.

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Your project's URL (Settings → API) |
| `SUPABASE_SERVICE_KEY` | yes | The `service_role` key, not `anon` — the backend bypasses RLS and enforces authorization itself |
| `JWT_SECRET` | yes | Random string, 32+ characters |
| `PORT` | no | Defaults to `3000` |
| `NODE_ENV` | no | `development` or `production` |
| `CORS_ORIGIN` | yes | The frontend's origin, e.g. `http://localhost:8000` |
| `REDIS_URL` | only in production | Shared refresh-token denylist across instances/restarts; see Quick Start above |
| `DOCS_ENABLED` | no | Set `false` to disable the public `/api/docs` Swagger UI |

## First Account

A fresh database has no accounts. Register the first creator via the API (or the register form in the UI):

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Your Name","institution":"Your Institution","email":"creator@example.com","password":"min6characters","defaultMethod":"AHP"}'
```

`-c cookies.txt` saves the session (httpOnly cookie) for follow-up requests. Log in as that same creator in the UI (`http://localhost:8000/DecideAI.html`), create a case, then invite experts from the creator dashboard — each invite generates a one-time temporary password for that expert's first login (shown once in the response/UI; there's no email service yet, so relay it to them directly).

## API

Swagger docs: `http://localhost:3000/api/docs` while the backend is running.
All endpoints live under `/api/v1` (auth, cases, experts, judgments, results, analytics, notifications).

## Self-hosting notes

This is self-hostable but not fully offline out of the box. The backend needs a Supabase project (hosted on supabase.com, or a self-hosted Supabase stack — this repo's `compose.yaml` only runs the backend, frontend and Redis, not Postgres/Supabase itself). The frontend (`frontend/DecideAI.html`) is a no-build page that loads React, Babel standalone, Tailwind, Recharts and other libraries from public CDNs (unpkg, cdnjs, `cdn.tailwindcss.com`) at runtime — an air-gapped deployment needs those files vendored locally first.

## License

MIT — see [LICENSE](LICENSE).
