# Deployment Guide — Claude Code / Claude.ai

## Quick Deploy (experienced users)

```bash
npm install && cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL, RESEND_API_KEY
docker compose up -d postgres redis
npm run db:push && npm run db:seed
./scripts/start.sh
```

---

## Prerequisites

Before starting, verify:

- **Node.js 20.x** — `node --version` (must be `v20.x.x`; specified in `Dockerfile`)
- **npm** — bundled with Node.js
- **PostgreSQL 15** — running locally or via Docker
- **Redis 7** — running locally or via Docker

> **Easiest setup:** Use Docker for infrastructure — `docker compose up -d postgres redis` starts both with correct versions and no manual config.

---

## Step 1 — Install Dependencies

```bash
npm install
```

**Why:** `node_modules/` is not included in the isolated copy. This restores all 47 declared packages (30 runtime + 17 dev).

**Verify:** Directory `node_modules/` appears, no `npm ERR!` in output.

---

## Step 2 — Configure Environment

```bash
cp .env.example .env
```

Open `.env` and set these values:

**Required:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hotel_crm
JWT_SECRET=<random 32+ char string>
JWT_REFRESH_SECRET=<different random 32+ char string>
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Hotel CRM <noreply@yourdomain.com>
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
HOSTNAME=localhost
```

**Optional (leave blank to disable):**
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hotel-crm
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice — use first output for `JWT_SECRET`, second for `JWT_REFRESH_SECRET`.

**Why secrets must be 32+ chars:** The `jose` library enforces minimum key length for HS256. Shorter values cause a hard crash at startup.

---

## Step 3 — Start Infrastructure

**Option A — Docker (recommended):**
```bash
docker compose up -d postgres redis
```

**Option B — Local install:**
```bash
# macOS
brew services start postgresql@15
brew services start redis

# Ubuntu/Debian
sudo systemctl start postgresql redis
```

**Verify:**
```bash
# PostgreSQL
psql "$DATABASE_URL" -c "SELECT version();"

# Redis
redis-cli ping   # → PONG
```

---

## Step 4 — Apply Database Schema

```bash
npm run db:push
```

**Why:** Drizzle ORM reads `src/db/schema.ts` and creates all tables (`guests`, `bookings`, `rooms`, `interactions`, `campaigns`, `permissions`, `users`, `sync_logs`). This is idempotent — safe to run multiple times.

**Optional — load demo data:**
```bash
npm run db:seed
```

This seeds test guests, rooms, users, and bookings so the app is usable immediately.

---

## Step 5 — Start Server

**Using management scripts:**
```bash
./scripts/start.sh     # Start (background, logs to logs/server.log)
./scripts/stop.sh      # Graceful stop
./scripts/reboot.sh    # Stop + start
./scripts/status.sh    # Check running state + PID + uptime
```

**Or directly (foreground — useful for debugging):**
```bash
npm run dev
```

**With background job workers (for email campaigns, channel sync):**
```bash
npm run dev:workers &
```

Workers require Redis. If Redis is unavailable, they fail silently and the main app still runs.

**With WebSocket server (Socket.io for real-time updates):**
```bash
npm run dev:ws   # runs server.ts instead of next dev
```

---

## Step 6 — Verify

```bash
# Check process
./scripts/status.sh

# Check health API
curl -s http://localhost:3000/api/health | jq .

# Tail logs
tail -f logs/server.log
```

Open **http://localhost:3000** in browser.

Expected: Hotel landing page (green theme). Navigate to `/login` for CRM login, `/staff/login` for staff portal.

**First admin login:** Check `src/db/seeds/` for seeded credentials, or create a user via the database directly.

---

## Troubleshoot

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED :5432` | PostgreSQL not running | `docker compose up -d postgres` |
| `ECONNREFUSED :6379` | Redis not running | `docker compose up -d redis` |
| `relation "guests" does not exist` | Schema not applied | `npm run db:push` |
| `JWT secret too short` | `JWT_SECRET` < 32 chars | Regenerate with crypto |
| `Port 3000 in use` | Another process | `lsof -ti:3000 \| xargs kill` or change `PORT` in `.env` |
| `Cannot find module '@/...'` | `node_modules` missing | `npm install` |
| `Build fails on Sentry` | Missing Sentry vars | Set `SENTRY_AUTH_TOKEN=` (empty) in `.env` |
| Workers crash immediately | Redis not reachable | Ensure `REDIS_URL` is correct and Redis is up |

---

## Docker — Full Stack Deployment

Runs all 5 services (app + worker + postgres + redis + minio):

```bash
# 1. Configure
cp .env.example .env
# Edit .env with production secrets

# 2. Build and start everything
docker compose up -d

# 3. Verify
docker compose ps
docker compose logs -f app
```

**Services:**
| Service | Port | Description |
|---------|------|-------------|
| app | 3000 | Next.js + Fastify |
| worker | — | BullMQ background jobs |
| postgres | 5432 | PostgreSQL 15 |
| redis | 6379 | Redis 7 |
| minio | 9000 / 9001 | S3 storage + web console |

---

## Notes for Claude (agentic execution)

- Never modify `.env` directly — always edit a copy
- `npm run db:push` is safe to run repeatedly (idempotent)
- `npm run db:seed` may insert duplicate data if run twice — check first
- MinIO and Sentry are optional — app runs without them
- The `ai/`, `docs/sprints/`, `skill/` directories in the parent folder are AI workflow files — do not touch
- RBAC: 4 roles — `admin`, `manager`, `marketing`, `receptionist`. Manager cannot delete. Enforce at middleware level.
