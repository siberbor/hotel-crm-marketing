# Architecture Decisions Log

This file records all architecture decisions made during AI-driven development.
Format: [DATE] [TASK] [Decision] [Rationale]

---

## Imported from docs/decisions/README.md

| #   | Decision                           | Status   | Date       |
| --- | ---------------------------------- | -------- | ---------- |
| 001 | Drizzle ORM over Prisma            | Accepted | 2026-04-15 |
| 002 | PostgreSQL FTS over Elasticsearch  | Accepted | 2026-04-15 |
| 003 | Socket.io for realtime (no SSE)    | Accepted | 2026-04-15 |
| 004 | BullMQ+Redis for channel sync only | Accepted | 2026-04-15 |

## New Decisions (AI Execution System)

| #   | Decision                             | Status   | Date       | Rationale                                          |
| --- | ------------------------------------ | -------- | ---------- | -------------------------------------------------- |
| 005 | Zod for input validation             | Accepted | 2026-04-16 | Next.js route handlers need schema validation      |
| 006 | RBAC via middleware (not decorators) | Accepted | 2026-04-16 | Simpler for Next.js App Router, no class overhead  |
| 007 | bcrypt over SHA-256 for passwords    | Accepted | 2026-04-16 | Industry standard for password hashing             |
| 008 | Vitest for unit + integration tests  | Accepted | 2026-04-16 | Fast, great TypeScript support, Next.js compatible |
| 009 | Mock services in unit tests          | Accepted | 2026-04-16 | No real DB during tests, deterministic results     |
