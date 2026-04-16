# Architecture Decision Records

ADR = Architecture Decision Record. One file per significant decision.
When an agent makes a non-obvious architectural choice, it creates a new ADR here.

## Index

| # | Title                              | Status   | Date       |
|---|------------------------------------|----------|------------|
| 001 | Drizzle ORM over Prisma           | Accepted | 2026-04-15 |
| 002 | PostgreSQL FTS over Elasticsearch  | Accepted | 2026-04-15 |
| 003 | Socket.io for realtime (no SSE)    | Accepted | 2026-04-15 |
| 004 | BullMQ+Redis for channel sync only | Accepted | 2026-04-15 |

---

## ADR-001: Drizzle ORM over Prisma

**Context:** Need an ORM for PostgreSQL.
**Decision:** Drizzle ORM.
**Rationale:** Better TypeScript inference, no code generation step, lighter runtime, JSONB support is first-class.
**Consequences:** Schema lives in `src/db/schema.ts`. Migrations via `npm run db:migrate`.

---

## ADR-002: PostgreSQL FTS over Elasticsearch

**Context:** Need full-text search across guests, bookings, campaigns.
**Decision:** PostgreSQL `ts_vector` + `ts_query`.
**Rationale:** Single hotel, ~50 rooms, max ~10k guests. Elasticsearch is operational overhead with zero benefit at this scale.
**Consequences:** Search queries use `to_tsquery()`. Index on guests(name, email, phone). Performance target: <200ms.

---

## ADR-003: Socket.io for realtime notifications

**Context:** Staff need real-time alerts (new booking, check-in, complaints).
**Decision:** Socket.io with per-user rooms.
**Rationale:** SSE is unidirectional; long-polling is inefficient. Socket.io handles reconnection, rooms, and namespaces cleanly.
**Consequences:** Redis adapter required for multi-instance. Room naming: `user:{userId}`.

---

## ADR-004: BullMQ + Redis scoped to channel sync only

**Context:** Channel Manager sync (Booking.com, Airbnb) must not block the main thread.
**Decision:** BullMQ queue with Redis, used ONLY for channel sync workers.
**Rationale:** Email (Resend handles async), notifications (WS), reports (cache) don't need a queue. Keeping Redis scope narrow reduces operational complexity.
**Consequences:** `src/workers/channel-sync.worker.ts`. Log every operation to `sync_logs` table.
