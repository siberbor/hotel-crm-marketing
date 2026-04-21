# Current Sprint: Sprint 5 — Staff Portal & Guest Personal Account

**Status:** ✅ DONE
**Started:** 2026-04-19
**Completed:** 2026-04-19
**Design reference:** `landing/*.png`

## Контекст

Оригинальный дизайн проекта (`landing/*.png`) — зелёная тема, MarkGCRM брендинг — не был реализован.
Основной CRM вырос в синем дизайне без некоторых модулей из макетов.
Sprint 5 = реализация задуманного: staff operations portal + личный кабинет гостя.

**Детальный план:** `docs/sprints/sprint5-staff-portal-guest-lk.md`

## Tasks

### Phase A — Staff Portal (по макетам)

| ID  | Title                                              | Status   |
| --- | -------------------------------------------------- | -------- |
| S01 | Инициализация приложения в `landing/`              | 🔲 TODO  |
| S02 | Auth: логин сотрудника (зелёный дизайн)            | 🔲 TODO  |
| S03 | Экран Номера: список, статус, даты бронирований    | 🔲 TODO  |
| S04 | Экран Задачи: CRUD, статусы, срочность             | 🔲 TODO  |
| S05 | Экран Задачи + Чеклист уборки                      | 🔲 TODO  |
| S06 | Экран Сотрудники: список, статус смены, задачи     | 🔲 TODO  |
| S07 | Форма Check-in: регистрация поселенца              | 🔲 TODO  |
| S08 | Карточка гостя: просмотр данных                    | 🔲 TODO  |
| S09 | Мобильная адаптация (Android Large макеты)         | 🔲 TODO  |

### Phase B — Личный кабинет гостя

| ID  | Title                                              | Status   |
| --- | -------------------------------------------------- | -------- |
| G01 | Публичный лендинг отеля                            | 🔲 TODO  |
| G02 | Auth гостя: вход по номеру брони + email           | 🔲 TODO  |
| G03 | API: JWT scope `guest` + endpoint `/auth/guest`    | 🔲 TODO  |
| G04 | ЛК: мои бронирования                              | 🔲 TODO  |
| G05 | ЛК: запрос доп. услуг                             | 🔲 TODO  |

## Sprint Goal

Реализовать staff operations portal согласно оригинальным макетам (`landing/*.png`).
Добавить личный кабинет гостя как отдельный продукт.
Оба используют существующий CRM API (`/api/v1/`) как backend.

## Открытые вопросы (требуют ответа перед стартом)

- [ ] **Стек landing/**: отдельный Next.js? Vite + React? Или маршруты внутри текущего Next.js?
- [ ] **Tasks API**: модуля задач нет в CRM — добавить `src/api/tasks/` в основной проект?
- [ ] **Staff shifts**: "Перерыв/Смена" из макетов — нужна таблица `shifts` в БД?
- [ ] **Guest auth**: новый endpoint или Magic Link по email?
