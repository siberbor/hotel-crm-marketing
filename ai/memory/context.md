# Project Context — Current State

Updated: 2026-04-16

---

## Current Sprint

**Sprint 1 — Critical Infrastructure** (Active)

## Sprint 1 Progress ✅

### Completed Tasks (T19-T24)

| ID  | Task                         | Status  |
| --- | ---------------------------- | ------- |
| T19 | PostgreSQL + Drizzle ORM     | ✅ Done |
| T20 | Zod validation schemas       | ✅ Done |
| T21 | RBAC middleware              | ✅ Done |
| T22 | bcrypt password hashing      | ✅ Done |
| T23 | Unit tests (69 tests)        | ✅ Done |
| T24 | Integration tests (13 tests) | ✅ Done |

### Test Results

```
Unit Tests:    8 files, 69 tests passed
Integration:   1 file, 13 tests passed
Total:        82 tests ✓
```

## Previous Sprints

### Sprint 0 — Foundation (Complete)

- T01-T18: Core infrastructure and features

## In Progress 🚀

- none

## Todo ○ (7 tasks)

- T25: WebSocket (Socket.io) for real-time notifications
- T26: Email sending with Resend API
- T27: BullMQ workers for background jobs
- T28: Channel Manager integrations
- T29: Docker configuration
- T30: React Query on frontend
- T31: Sentry error monitoring

## Known Blockers

None

## Key Files Changed (T19-T24)

### Database Layer

- `src/db/schema.ts` - Drizzle schema
- `src/db/index.ts` - DB connection
- `drizzle.config.ts` - Migration config

### Services (Connected to PostgreSQL)

- `src/services/guest.service.ts`
- `src/services/booking.service.ts`
- `src/services/interaction.service.ts`
- `src/services/campaign.service.ts`
- `src/services/room.service.ts`
- `src/services/sync.service.ts`

### Security

- `src/middleware/permissions.ts` - RBAC enforcement
- `src/app/api/auth/login/route.ts` - bcrypt hashing

### Validation

- All API routes now have Zod schemas

### Tests

- `tests/unit/*.test.ts` (8 files, 69 tests)
- `tests/integration/*.test.ts` (1 file, 13 tests)
- `vitest.config.ts`, `vitest.config.api.ts`

## Architecture Decisions (ADR-005 to ADR-009)

1. Zod for input validation
2. RBAC via middleware
3. bcrypt for passwords
4. Vitest for testing
5. Mock services in unit tests

## Next Steps

1. T25: Implement WebSocket/Socket.io for real-time notifications
2. T26: Integrate Resend API for email campaigns
3. Continue with T27-T31
