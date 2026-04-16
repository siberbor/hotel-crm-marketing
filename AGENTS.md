---
name: hotel-crm-marketing
version: 1.0.0
description: CRM система для провинциального отеля (маркетинговая группа)
stack: [Next.js 14, Fastify, PostgreSQL 15, Drizzle ORM, Tailwind CSS]
agents_tested: [claude-code, qwen-code, opencode, gpt-4o-operator]
---

# CRM Hotel Marketing — Agent Context

## Project in One Line
Монолитная CRM для провинциального отеля (~50 номеров): управление гостями, бронированиями и маркетинговыми кампаниями. Средняя нагрузка, один отель.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (App Router), Tailwind CSS, React Query v5 |
| Backend    | Fastify 4 + Zod validation          |
| Database   | PostgreSQL 15, Drizzle ORM          |
| Auth       | JWT (jose library) + bcrypt, RBAC   |
| Email      | Resend API                          |
| Realtime   | Socket.io (WebSocket only, no SSE)  |
| Queue      | BullMQ + Redis (channel sync only)  |
| Testing    | Vitest + Supertest                  |
| Linting    | ESLint + Prettier (Biome compatible)|

## Directory Layout

```
/
├── src/
│   ├── api/            # Fastify route handlers
│   │   ├── auth/
│   │   ├── guests/
│   │   ├── bookings/
│   │   ├── interactions/
│   │   ├── campaigns/
│   │   ├── reports/
│   │   ├── search/
│   │   └── health.ts
│   ├── services/       # Business logic (no HTTP)
│   ├── db/
│   │   ├── schema.ts   # Drizzle schema (single source of truth)
│   │   ├── migrations/
│   │   └── seeds/
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── rbac.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── permissions.ts
│   ├── workers/        # BullMQ workers
│   ├── ws/             # Socket.io handlers
│   ├── jobs/           # node-cron scheduled jobs
│   ├── integrations/   # Channel Manager, external APIs
│   ├── components/
│   │   └── ui/         # Design system components
│   └── pages/          # Next.js App Router pages
├── tests/
├── AGENTS.md           # This file — read first, always
├── CLAUDE.md           # Claude-specific additions (imports this file)
├── CLAUDE.local.md     # Local secrets — NEVER commit, NEVER read aloud
└── .env.example
```

## Database Schema (Critical)

```
guests          — central entity. Leads AND guests. preferences: JSONB. tags: JSONB[]
bookings        — FK → guests, rooms. statuses: pending|confirmed|checked_in|checked_out|cancelled
rooms           — room catalog
interactions    — guest contact log. type: call|email|meeting|complaint|compliment. FK → guests (required), bookings (optional)
campaigns       — email marketing. FK → segments
permissions     — RBAC matrix: role, resource, action
sync_logs       — channel manager sync history
users           — staff accounts. onboarding_completed: boolean
```

**Key constraint:** A guest can exist without a booking (they are a lead).

## Roles & Permissions

| Role         | Can delete | Can see financials | Can send campaigns |
|--------------|------------|--------------------|--------------------|
| admin        | ✓          | ✓                  | ✓                  |
| manager      | ✗          | ✓                  | ✓                  |
| marketing    | ✗          | ✗                  | ✓                  |
| receptionist | ✗          | ✗                  | ✗                  |

**Rule:** Every mutating request goes through `src/middleware/permissions.ts` check.

## Hard Rules (Never Violate)

1. **No Elasticsearch** — use PostgreSQL FTS (ts_vector). Sufficient for this load.
2. **WebSocket only via Socket.io** — no SSE, no long-polling.
3. **No online payments** — payment status is set manually by staff.
4. **Heavy queries → /api/reports** — separate route, 1-hour cache.
5. **Channel sync → BullMQ queue** — never block main thread.
6. **Secrets → .env** — never log, never hardcode, never read CLAUDE.local.md aloud.
7. **manager role cannot delete** — enforce at middleware level, not just UI.
8. **Frontend search: debounce 300ms** — Postgres FTS only fires after pause.

## Dev Commands

```bash
npm run dev          # start dev server
npm run db:push      # apply Drizzle schema changes
npm run db:migrate   # run pending migrations
npm run db:seed      # seed test data
npm run test         # Vitest
npm run test:api     # Supertest integration tests
npm run lint:fix     # ESLint + Prettier auto-fix
npm run build        # production build
```

## API Conventions

- Base path: `/api/v1/`
- Auth header: `Authorization: Bearer <token>`
- Pagination: `?page=1&limit=20` → `{ data: [], total, page, limit }`
- Errors: `{ error: { code: string, message: string } }`
- All timestamps: ISO 8601 UTC

## Environment Variables

```bash
DATABASE_URL=         # PostgreSQL connection string
JWT_SECRET=           # min 32 chars
JWT_REFRESH_SECRET=   # min 32 chars
RESEND_API_KEY=       # Email sending
REDIS_URL=            # BullMQ + Socket.io adapter
MINIO_ENDPOINT=       # S3-compatible storage (or AWS_S3_BUCKET)
SENTRY_DSN=           # Error monitoring
```

## Agent Session Protocol

**Before starting any task:**
1. Read this file completely
2. Check `docs/sprints/current-sprint.md` for active sprint context
3. Check `docs/decisions/` for relevant architecture decisions
4. Never assume file structure — verify with ls/read

**While working:**
- After each significant change, note it in `docs/sprints/session-log.md`
- If you make an architecture decision not covered here, add it to `docs/decisions/`
- Run `npm run lint:fix` before finishing

**Before ending session:**
- Update `docs/sprints/session-log.md` with: what was done, what is blocked, open questions
- If AGENTS.md needs updating (new rule discovered, new file added), update it

## Figma Reference

Project map: https://www.figma.com/design/msJpfLEKsfw09vfYL6wN1e/
Node IDs for key screens are documented in `docs/design/screen-map.md`
Design tokens → `src/styles/tokens.css` (primary: #2563EB)

## AI Execution System

This project uses a multi-agent execution pipeline located in `/ai/`.

### Structure
```
ai/
  system/    — rules.md, architecture.md, workflow.md
  agents/    — orchestrator, planner, backend, frontend, qa, review
  memory/    — context.md, decisions.md, sessions/
  kanban/    — index.json (task status) + tasks/*.md (task details)
  bin/       — run.js (CLI), kanban-sync.js (sync), server.js (dashboard)
  runs/      — execution logs per run
```

### Quick Start
```bash
node ai/bin/run.js --status        # show kanban state
node ai/bin/run.js --list          # list all tasks
node ai/bin/run.js --dry-run       # preview next task
node ai/bin/run.js                 # execute next todo task
node ai/bin/run.js --task T12      # execute specific task
node ai/bin/run.js --done T12      # mark task done
node ai/bin/run.js --move T12 review  # move to status
node ai/bin/kanban-sync.js --validate # check consistency
node ai/bin/server.js              # live dashboard → http://localhost:3200
```

### Rules for Agents Using /ai/
1. Always read `ai/kanban/index.json` before starting work
2. Always read `ai/memory/context.md` for current project state
3. Check task dependencies are `done` before starting
4. After execution: update kanban, append to memory/sessions/, update context.md
5. Record architecture decisions in `ai/memory/decisions.md`
6. **Conflict resolution: AGENTS.md wins over everything in /ai/**
