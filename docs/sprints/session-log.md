# Session Log

Agents append to this file at the end of every session.
Format: ## Session [DATE TIME] → Done / Blocked / Decisions / Next

---

## Session 2026-04-16 — Sprint 0 started

**Done:**

- T01: Project initialized with Next.js 14, Drizzle ORM, schema created
- T02: Auth module (JWT + 4 roles), login/logout endpoints
- UI: Basic layout, login page, dashboard

**Next:** T04 (UI Design System)

## Session 2026-04-16 — UI Components + Guest CRUD

**Done:**

- T04: UI Design System — Button, Input, Card, Badge, Modal, Table components
- T03: Guest CRUD — API /api/guests, /api/guests/[id], page /guests with search, add, edit, delete

**Blocked:** None

**Decisions:**

- In-memory demo data (no PostgreSQL yet)
- Dark mode support in all components

**Next:** T05 (Dashboard) or T06 (Bookings)

## Session 2026-04-17 — Sprint 1 started, T25 done

**Done:**
- Fixed dashboard/page.tsx: extra `</div>` at EOF
- Fixed bookings/page.tsx: outer div closed before Modal
- Fixed booking.service.ts: pre-existing TS type error
- T25: WebSocket/Socket.io — custom server (server.ts), src/ws/index.ts, src/hooks/useSocket.ts, NotificationBell upgraded to real-time
- Sprint 1 created (T25–T31), all task files created

**Blocked:** None

**Decisions:**
- Socket.io runs on custom Next.js server (`npm run dev:ws`), not via `next dev` — avoids patching Next internals
- emit functions are null-safe — work even when Socket.io not initialized (e.g. plain `next dev`)

**Next:** T27 (BullMQ) → T26 (Resend email) — T27 must come first (T26 depends on it)

## Session 2026-04-17 — T31 Sentry done, Sprint 1 complete

**Done:**
- T31: Sentry error monitoring — sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
- next.config.cjs wrapped with withSentryConfig (source maps, dryRun when no DSN)
- server.ts: Sentry.captureException on unhandled HTTP errors
- src/app/global-error.tsx: App Router error boundary with Sentry capture
- .env.example: added NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
- PII filtered in beforeSend (email, phone, password, token, user.ip_address)
- Sentry.init only fires when DSN env var is set (safe for local dev without Sentry account)
- Sprint 1 marked complete (all T25–T31 done)

**Blocked:** None

**Decisions:**
- NEXT_PUBLIC_SENTRY_DSN for client (browser), SENTRY_DSN for server — separate env vars per Sentry docs
- dryRun: !process.env.SENTRY_DSN — skips source map upload in local dev

**Next:** Sprint 2 planning needed. All sprints 0–1 complete. Possible next areas: real PostgreSQL integration (replace in-memory), production hardening, E2E tests.

## Session 2026-04-18 — Sprint 2 complete

**Done:**
- T32: GET/PATCH/DELETE /api/campaigns/[id] — already implemented, verified
- T33: GET/DELETE /api/interactions/[id] — already implemented, verified
- T34: API integration tests — created tests/api/bookings.test.ts (13 tests), campaigns.test.ts (11 tests), interactions.test.ts (11 tests); fixed pre-existing guests.test.ts (now 4 tests); vitest.config.api.ts updated to include tests/api/**
- T35: Rate limiting — added rateLimit() to PATCH/DELETE in bookings/[id], campaigns/[id], interactions/[id], guests/[id]
- Bug fix: booking.service.ts — getBookingById/updateBooking/deleteBooking lacked empty-DB fallback to demoStore; fixed with count(*) check
- Bug fix: demo-store.ts — added getBookingById and deleteBooking methods
- Bug fix: bookings/route.ts + bookings/[id]/route.ts — await queue.add() hung when Redis down; changed to fire-and-forget .catch()
- All 55 tests pass (6 test files)

**Blocked:** None

**Decisions:**
- Next.js App Router: each route file gets separate bundle — module-level state NOT shared between /api/bookings/route.ts and /api/bookings/[id]/route.ts; tests use fixed demo IDs (1-3) not create-then-get
- Integration tests use X-Forwarded-For to bypass login rate limiter (5 req/min) for multi-role tests
- testTimeout: 15000ms in vitest.config.api.ts (DB connect_timeout is 5s, need margin)

**Next:** Sprint 3 planning. Candidates: real PostgreSQL integration, E2E tests with Playwright, channel manager integration, onboarding flow, reports/analytics.
