# Project Workability Analysis

**Generated:** 2026-04-21  
**Source directory:** `Project CRM/`  
**Isolated to:** `Project CRM/project-isolated/`

---

## Project Type & Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14.2.0 (App Router), React 18, Tailwind CSS, React Query v5 |
| Backend | Fastify 4 + Zod validation (routes in `src/api/`) |
| Custom server | `server.ts` — Node HTTP server wrapping Next.js + Socket.io |
| Database | PostgreSQL 15, Drizzle ORM (`src/db/schema.ts`) |
| Auth | JWT (jose) + bcrypt, RBAC (`src/middleware/permissions.ts`) |
| Email | Resend API (`src/services/email.service.ts`) |
| Realtime | Socket.io via custom server (no SSE) |
| Queue | BullMQ + Redis (`src/workers/`) |
| Scheduler | node-cron (`src/jobs/`) |
| Monitoring | Sentry (optional) |
| Testing | Vitest + Supertest + Playwright |
| Runtime | **Node.js 20.x** (specified in Dockerfile; no `.nvmrc`) |
| Package manager | npm (package-lock.json present) |

**Total source files:** 111 TypeScript files across 16 subdirectories in `src/`

---

## Entry Points

### Development (recommended)
```bash
npm run dev          # Next.js dev server → http://localhost:3000
npm run dev:workers  # BullMQ workers (separate process, needs Redis)
```

### Production
```bash
npm run build        # Compile Next.js app
npm run start        # Start production server → http://localhost:3000
```

### Custom server (with Socket.io)
```bash
npm run dev:ws       # tsx server.ts — wraps Next.js with Socket.io + BullMQ
```

The custom `server.ts` is needed for **real-time features** (Socket.io). For static/API-only use, `npm run dev` is sufficient.

---

## Dependencies Status

**Runtime dependencies:** 30 packages  
**Dev dependencies:** 17 packages  
**Lock file:** `package-lock.json` ✓ present  
**`node_modules/`:** ❌ NOT present (excluded from isolation — run `npm install`)

Key runtime dependencies:
| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.0 | Framework |
| react / react-dom | 18.x | UI |
| fastify | 4.x | API server |
| drizzle-orm | latest | ORM |
| @neondatabase/serverless | latest | PostgreSQL driver |
| bullmq | latest | Job queue |
| socket.io | latest | WebSocket |
| jose | latest | JWT |
| zod | latest | Schema validation |
| @tanstack/react-query | 5.x | Data fetching |
| resend | latest | Email |
| tailwindcss | 3.x | CSS |

---

## Environment Variables

Copy `.env.example` → `.env` and fill in all required values.

| Variable | Required | Default (example) | Description |
|----------|----------|-------------------|-------------|
| `DATABASE_URL` | **YES** | `postgresql://postgres:postgres@localhost:5432/hotel_crm` | PostgreSQL connection string |
| `JWT_SECRET` | **YES** | *(must replace)* | Min 32 chars — signs access tokens |
| `JWT_REFRESH_SECRET` | **YES** | *(must replace)* | Min 32 chars — signs refresh tokens |
| `RESEND_API_KEY` | **YES** | `re_xxx...` | Email service API key |
| `EMAIL_FROM` | **YES** | `CRM Hotel <noreply@yourdomain.com>` | Sender identity |
| `REDIS_URL` | **YES** | `redis://localhost:6379` | BullMQ + Socket.io adapter |
| `MINIO_ENDPOINT` | optional | `localhost:9000` | S3-compatible storage |
| `MINIO_ACCESS_KEY` | optional | `minioadmin` | MinIO credentials |
| `MINIO_SECRET_KEY` | optional | `minioadmin` | MinIO credentials |
| `MINIO_BUCKET` | optional | `hotel-crm` | S3 bucket name |
| `SENTRY_DSN` | optional | *(empty)* | Error monitoring |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | *(empty)* | Public Sentry key |
| `SENTRY_ORG` | optional | *(empty)* | Sentry org slug |
| `SENTRY_PROJECT` | optional | *(empty)* | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | optional | *(empty)* | Sentry auth token |
| `NODE_ENV` | **YES** | `development` | `development` or `production` |
| `PORT` | **YES** | `3000` | Application port |
| `HOSTNAME` | **YES** | `localhost` | Bind address |

---

## Ports & Networking

| Port | Service | Required |
|------|---------|---------|
| 3000 | Next.js app (main) | YES |
| 5432 | PostgreSQL | YES |
| 6379 | Redis | YES (for Socket.io + BullMQ) |
| 9000 | MinIO S3 API | No (file uploads only) |
| 9001 | MinIO web console | No |

---

## Docker Infrastructure

`docker-compose.yml` defines 5 services:
- `app` — Next.js application container
- `worker` — BullMQ worker container
- `postgres` — PostgreSQL 15
- `redis` — Redis 7
- `minio` — S3-compatible storage

To run everything via Docker:
```bash
cp .env.example .env
# Edit .env with real secrets
docker compose up -d
```

---

## Potential Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| `node_modules/` missing | **BLOCKER** | Run `npm install` |
| `.env` not configured | **BLOCKER** | Copy `.env.example` → `.env`, fill values |
| PostgreSQL not running | **BLOCKER** | Start via Docker or local install |
| Database schema not applied | **BLOCKER** | Run `npm run db:push` after DB is up |
| Redis not running | **HIGH** | Required for Socket.io + BullMQ; start via Docker |
| No `.nvmrc` file | LOW | Use Node 20.x explicitly (`nvm use 20` or check `node --version`) |
| MinIO not running | LOW | File uploads will fail; rest of app works fine |
| Sentry DSN empty | INFO | Monitoring disabled — app runs normally |
| `JWT_SECRET` < 32 chars | **HIGH** | Auth will fail at runtime; use a strong random string |

---

## Recommended Start Sequence

### Quick start (dev mode, minimal dependencies)
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL

# 3. Start infrastructure
docker compose up -d postgres redis

# 4. Apply database schema
npm run db:push

# 5. (Optional) Seed demo data
npm run db:seed

# 6. Start app
npm run dev
# → http://localhost:3000
```

### Full start (with workers + real-time)
```bash
npm run dev &           # Next.js app
npm run dev:workers &   # BullMQ workers
```

### Production
```bash
npm run build
npm run start
```

### Docker (all services)
```bash
docker compose up -d
```

---

## File Structure Summary

```
project-isolated/
├── src/                    # 111 TypeScript source files
│   ├── api/                # Fastify route handlers
│   ├── app/                # Next.js App Router pages
│   │   ├── (app)/          # CRM (bookings, guests, campaigns, reports...)
│   │   ├── (auth)/         # Login
│   │   ├── (guest)/        # Guest portal
│   │   └── (staff)/        # Staff operations portal
│   ├── auth/               # JWT + RBAC
│   ├── components/         # React UI components
│   ├── db/                 # Drizzle schema + migrations + seeds
│   ├── middleware/         # Auth + permissions middleware
│   ├── services/           # Business logic (8 services)
│   ├── workers/            # BullMQ background workers
│   ├── ws/                 # Socket.io handlers
│   └── styles/             # CSS tokens + global styles
├── public/                 # Static assets + PWA manifest
├── tests/                  # api / e2e / integration / unit
├── landing/                # Design reference PNGs (mockups)
├── docs/
│   ├── design/             # Screen map + design references
│   └── decisions/          # Architecture Decision Records
├── scripts/                # start / stop / reboot / status
├── logs/                   # Server logs (gitkeep placeholder)
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Full infrastructure stack
├── package.json            # npm scripts + dependencies
├── .env.example            # Environment variable template
├── server.ts               # Custom Node server (Socket.io entry)
└── project_analysis.md     # This file
```
