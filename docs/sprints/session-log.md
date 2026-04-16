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
