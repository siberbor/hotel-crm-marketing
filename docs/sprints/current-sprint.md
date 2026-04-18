# Current Sprint: Sprint 3 — Production Hardening

**Status:** 🔄 In Progress
**Started:** 2026-04-18

## Tasks

| ID  | Title                                     | Status         |
| --- | ----------------------------------------- | -------------- |
| T36 | Real DB seed + migration                  | ⬜ Todo        |
| T37 | Playwright E2E tests                      | ⬜ Todo        |
| T38 | OpenAPI /api/docs                         | ✅ Done        |
| T39 | Onboarding complete flow                  | ✅ Done        |

## Sprint Goal

Подготовить систему к продакшену. Реальные данные, E2E тесты, документация API, онбординг.

## Sprint Checklist

- [x] PATCH /api/auth/me помечает onboarding_completed=true
- [x] Новые юзеры (onboarding_completed=false) редиректятся на /onboarding
- [x] Кнопки "Завершить" и "Пропустить" вызывают API перед редиректом
- [ ] npm run db:seed заполняет реальную БД
- [ ] Playwright E2E: login, create guest, send campaign
- [ ] Swagger UI на /api-docs
