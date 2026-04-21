# Deployment Guide — opencode

> Agentic task list. Execute each step in order. Mark done when confirmed.

---

## Prerequisites

- [ ] **Node.js 20.x** installed — `node --version` → `v20.x.x`
- [ ] **npm** installed — `npm --version`
- [ ] **PostgreSQL 15** running and accessible
- [ ] **Redis 7** running and accessible
- [ ] Project files present in working directory

> Docker alternative: skip PostgreSQL/Redis manual install, use `docker compose up -d postgres redis` instead.

---

## Task 1 — Install dependencies

```bash
npm install
```

Verify: `node_modules/` directory exists, no errors in output.

---

## Task 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` — fill in these required values:

| Variable | What to set |
|----------|------------|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:5432/hotel_crm` |
| `JWT_SECRET` | Random string, min 32 chars |
| `JWT_REFRESH_SECRET` | Random string, min 32 chars (different from above) |
| `RESEND_API_KEY` | Get from https://resend.com |
| `EMAIL_FROM` | `Hotel CRM <noreply@yourdomain.com>` |
| `REDIS_URL` | `redis://localhost:6379` |
| `NODE_ENV` | `development` or `production` |
| `PORT` | `3000` |
| `HOSTNAME` | `localhost` |

Optional (leave empty to disable):
- `MINIO_*` — file upload storage
- `SENTRY_*` — error monitoring

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Task 3 — Start infrastructure (if not using Docker)

```bash
# PostgreSQL — start your local instance, or:
docker compose up -d postgres redis
```

Verify PostgreSQL:
```bash
psql "$DATABASE_URL" -c "SELECT 1"
```

Verify Redis:
```bash
redis-cli ping   # → PONG
```

---

## Task 4 — Apply database schema

```bash
npm run db:push
```

This runs Drizzle ORM schema sync. No destructive changes on first run.

Optional — seed demo data:
```bash
npm run db:seed
```

---

## Task 5 — Start server

**Using management scripts (recommended):**
```bash
./scripts/start.sh
```

**Or directly:**
```bash
npm run dev
```

**With BullMQ workers (for background jobs):**
```bash
npm run dev:workers &
```

---

## Task 6 — Verify server is running

```bash
# Check status
./scripts/status.sh

# Check health endpoint
curl http://localhost:3000/api/health

# View live logs
tail -f logs/server.log
```

Expected response from `/api/health`: HTTP 200 with JSON status.

Open in browser: http://localhost:3000

---

## Task 7 — Stop server

```bash
./scripts/stop.sh
```

Restart:
```bash
./scripts/reboot.sh
```

---

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED 5432` | PostgreSQL not running | `docker compose up -d postgres` |
| `ECONNREFUSED 6379` | Redis not running | `docker compose up -d redis` |
| `Invalid JWT secret` | `JWT_SECRET` < 32 chars | Regenerate with `crypto.randomBytes(32)` |
| `relation "users" does not exist` | Schema not applied | Run `npm run db:push` |
| `Port 3000 already in use` | Another process on 3000 | `lsof -i:3000` then kill, or set `PORT=3001` in `.env` |
| `Cannot find module` | `node_modules` missing | Run `npm install` |

---

## Docker — Full Stack

```bash
cp .env.example .env
# Edit .env with real secrets
docker compose up -d
```

All 5 services start: app, worker, postgres, redis, minio.

Check logs: `docker compose logs -f app`
