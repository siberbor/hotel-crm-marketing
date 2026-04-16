# Architecture Snapshot — Hotel CRM

## Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | Next.js 14 (App Router), Tailwind, React Query v5 |
| Backend  | Fastify 4 + Zod validation                    |
| Database | PostgreSQL 15 + Drizzle ORM                   |
| Auth     | JWT (jose) + bcrypt, 4 roles                  |
| Email    | Resend API                                    |
| Realtime | Socket.io (WS only)                           |
| Queue    | BullMQ + Redis (channel sync only)            |
| Testing  | Vitest + Supertest                            |
| Lint     | ESLint + Prettier                             |

## Directory Structure

```
src/
  api/            — Fastify route handlers (auth, guests, bookings, interactions, campaigns, reports, search)
  services/       — Business logic (no HTTP)
  db/
    schema.ts     — Drizzle schema (SINGLE SOURCE OF TRUTH)
    migrations/
    seeds/
  auth/
    jwt.ts
    rbac.ts
  middleware/
    auth.ts
    permissions.ts
  workers/        — BullMQ workers
  ws/             — Socket.io handlers
  jobs/           — node-cron scheduled jobs
  integrations/   — Channel Manager, external APIs
  components/ui/  — Design system components
  pages/          — Next.js App Router pages
tests/
```

## Database Schema (Compressed)

```
guests         — central entity (leads AND guests). preferences: JSONB, tags: JSONB[]
bookings       — FK→guests, rooms. statuses: pending|confirmed|checked_in|checked_out|cancelled
rooms          — room catalog
interactions   — type: call|email|meeting|complaint|compliment. FK→guests (req), bookings (opt)
campaigns      — email marketing. FK→segments
permissions    — RBAC: role, resource, action
sync_logs      — channel manager sync history
users          — staff accounts. onboarding_completed: boolean
```

Key: guest can exist without booking (they are a lead).

## RBAC Matrix

| Role         | Delete | Financials | Campaigns |
|--------------|--------|------------|-----------|
| admin        | ✓      | ✓          | ✓         |
| manager      | ✗      | ✓          | ✓         |
| marketing    | ✗      | ✗          | ✓         |
| receptionist | ✗      | ✗          | ✗         |

## Hard Rules (Compressed)

1. NO Elasticsearch → use PostgreSQL FTS (ts_vector)
2. WebSocket ONLY via Socket.io — no SSE, no long-polling
3. NO online payments — payment status set manually
4. Heavy queries → /api/reports (1h cache)
5. Channel sync → BullMQ queue (never block main thread)
6. Secrets → .env only
7. manager CANNOT delete — enforce at middleware
8. Frontend search: debounce 300ms

## API Conventions

- Base: `/api/v1/`
- Auth: `Authorization: Bearer <token>`
- Pagination: `?page=1&limit=20` → `{ data, total, page, limit }`
- Errors: `{ error: { code, message } }`
- Timestamps: ISO 8601 UTC

## Code Style

- Named exports only (no default except pages)
- ES modules (import/export, no require)
- 2-space indentation
- Zod schemas co-located with route handlers
- No `any` types — use `unknown` and narrow

## Dev Commands

```bash
npm run dev          # dev server
npm run db:push      # apply Drizzle changes
npm run db:migrate   # run pending migrations
npm run db:seed      # seed test data
npm run test         # Vitest
npm run test:api     # Supertest integration tests
npm run lint:fix     # ESLint + Prettier
npm run build        # production build
```

## ADRs (Accepted)

| #   | Decision                              |
|-----|---------------------------------------|
| 001 | Drizzle ORM over Prisma               |
| 002 | PostgreSQL FTS over Elasticsearch     |
| 003 | Socket.io for realtime (no SSE)       |
| 004 | BullMQ+Redis for channel sync only    |
