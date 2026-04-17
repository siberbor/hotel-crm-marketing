# Current Sprint: Sprint 2 — API Completeness & Tests

**Status:** ✅ Complete
**Started:** 2026-04-17

## Tasks

| ID  | Title                                     | Status      |
| --- | ----------------------------------------- | ----------- |
| T32 | CRUD /api/campaigns/[id]                  | ✅ Done     |
| T33 | CRUD /api/interactions/[id]               | ✅ Done     |
| T34 | API integration tests (bookings, campaigns, interactions) | ✅ Done |
| T35 | Rate limiting on mutation endpoints       | ✅ Done     |

## Sprint Goal

Закрыть функциональные пробелы API. Покрыть тестами все ключевые эндпоинты.
Добавить rate limiting для защиты от злоупотреблений.

## Sprint Checklist

- [ ] GET/PATCH/DELETE /api/campaigns/[id] работает
- [ ] GET/DELETE /api/interactions/[id] работает
- [ ] Тесты: bookings, campaigns, interactions API
- [ ] Rate limiting на POST/PATCH/DELETE
