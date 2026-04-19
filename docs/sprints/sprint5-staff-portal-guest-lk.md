# Sprint 5 — Hotel Website + Staff Portal + Guest LK

**Статус:** 🔲 TODO
**Design reference:** `landing/*.png`

---

## Архитектура (финальная, подтверждена)

| URL | Что | Брендинг | Аудитория |
|-----|-----|----------|-----------|
| `/` | Витрина отеля (заменяет текущий page.tsx) | Зелёный из макетов | Постояльцы |
| `/guest/login` | Вход в ЛК гостя | Зелёный | Постояльцы |
| `/guest/*` | Личный кабинет (брони, услуги) | Зелёный | Авт. постояльцы |
| `/staff/login` | Вход staff operations | Зелёный (Авторизация.png) | Персонал |
| `/staff/*` | Operations portal (Номера/Задачи/Сотрудники) | Зелёный | Персонал |
| `/login` | CRM вход | Синий #2563EB | Менеджеры/Админы |
| `/app/*` | CRM (без изменений) | Синий | Менеджеры/Админы |

---

## Фирменный стиль (из макетов)

| Токен | Значение | Источник |
|-------|----------|----------|
| `--green-primary` | `#7CB342` (lime green из кнопок) | Все макеты |
| `--header-bg` | `#1A1A1A` | Хедер staff portal |
| `--status-free` | зелёная точка `#4CAF50` | Номера, Сотрудники |
| `--status-busy` | жёлтая точка `#FFC107` | Номера, Сотрудники |
| `--status-urgent` | красная точка `#F44336` | Задачи |
| Hero фото | bathtub/spa атмосфера | Авторизация.png, Android Large |
| Font | Inter | все макеты |

Файл токенов: `src/styles/tokens-green.css`

---

## Файловая структура

```
src/
├── app/
│   ├── page.tsx                    # REPLACE → витрина отеля (зелёный)
│   ├── layout.tsx                  # корневой layout (без изменений)
│   │
│   ├── (auth)/login/               # CRM staff login (синий, без изменений)
│   ├── (app)/                      # CRM (синий, без изменений)
│   │
│   ├── (staff)/                    # NEW: Staff operations portal
│   │   ├── layout.tsx              #   Хедер: имя, дата/время, статус смены, Завершить смену
│   │   ├── login/page.tsx          #   Авторизация.png
│   │   ├── rooms/page.tsx          #   Номера.png + Android Large - 2.png
│   │   ├── rooms/[id]/page.tsx     #   Детали номера + открыть check-in
│   │   ├── tasks/page.tsx          #   Задачи.png + Задачи и чеклист.png
│   │   ├── employees/page.tsx      #   Сотрудники.png
│   │   └── checkin/
│   │       ├── page.tsx            #   Регистрация поселенца.png
│   │       └── [bookingId]/page.tsx#   Анкета поселенца.png (карточка)
│   │
│   ├── (guest)/                    # NEW: Личный кабинет гостя
│   │   ├── layout.tsx              #   Публичный хедер + link CRM login
│   │   ├── login/page.tsx          #   Email + пароль
│   │   ├── bookings/page.tsx       #   Мои бронирования
│   │   └── services/page.tsx       #   Запросить доп. услугу
│   │
│   └── api/
│       ├── tasks/route.ts          # NEW: GET/POST tasks
│       ├── tasks/[id]/route.ts     # NEW: PATCH/DELETE task
│       ├── shifts/route.ts         # NEW: GET current shift / POST start
│       ├── shifts/[id]/route.ts    # NEW: PATCH (break/end)
│       └── auth/
│           └── guest/route.ts      # NEW: POST guest login → JWT scope=guest
│
├── services/
│   ├── tasks.ts                    # NEW
│   └── shifts.ts                   # NEW
│
├── components/
│   ├── ui/                         # Существующий (синий) — без изменений
│   ├── staff/                      # NEW: компоненты staff portal
│   │   ├── RoomCard.tsx
│   │   ├── TaskRow.tsx
│   │   ├── ChecklistPanel.tsx
│   │   ├── EmployeeRow.tsx
│   │   └── CheckinForm.tsx
│   └── guest/                      # NEW: компоненты ЛК
│       ├── BookingCard.tsx
│       └── ServiceRequestForm.tsx
│
├── styles/
│   └── tokens-green.css            # NEW: зелёные CSS vars
│
└── db/
    └── schema.ts                   # EXTEND: + tasks, shifts, guest_accounts
```

---

## Новые таблицы БД

```typescript
// В src/db/schema.ts — добавить:

export const guestAccounts = pgTable("guest_accounts", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guests.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("todo"),
  // статусы: todo | in_progress | urgent | done | postponed
  assignedTo: integer("assigned_to").references(() => users.id),
  roomId: integer("room_id").references(() => rooms.id),
  scheduledTime: timestamp("scheduled_time"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 50 }).notNull().default("working"),
  // статусы: working | break | done
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## JWT изменения

```typescript
// src/auth/jwt.ts — расширить TokenPayload:
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  scope: 'staff' | 'guest'  // NEW
  guestId?: number           // NEW: только при scope=guest
}
```

Middleware `src/middleware/auth.ts` — добавить в PUBLIC_PATHS:
- `/guest` (публичный лендинг ЛК / форма входа)
- `/guest/login`
- `/api/auth/guest`
- `/staff/login`
- `/api/staff/...` — guard отдельный (scope=staff)

---

## Задачи (порядок выполнения)

### Блок 1 — Основа (делать первым, всё зависит от этого)
| ID | Задача | Файл |
|----|--------|------|
| S01 | DB schema: + tasks, shifts, guest_accounts | `src/db/schema.ts` |
| S02 | JWT: + scope/guestId в TokenPayload | `src/auth/jwt.ts` |
| S03 | Middleware: маршруты staff/* и guest/* | `src/middleware/auth.ts` |
| S04 | CSS tokens зелёного стиля | `src/styles/tokens-green.css` |

### Блок 2 — Витрина отеля
| ID | Задача | Файл |
|----|--------|------|
| W01 | Заменить page.tsx на витрину (зелёный, spa-стиль) | `src/app/page.tsx` |
| W02 | Секция: Hero с фото + название отеля | в W01 |
| W03 | Секция: Каталог номеров (публичный, из БД) | в W01 |
| W04 | Секция: Контакты, footer | в W01 |
| W05 | Кнопка "Личный кабинет" в хедере → /guest/login | в W01 |
| W06 | Кнопка "Для персонала" в footer → /login (CRM) | в W01 |

### Блок 3 — Личный кабинет гостя
| ID | Задача | Файл |
|----|--------|------|
| G01 | API: POST /api/auth/guest (email+pass → JWT guest) | `src/app/api/auth/guest/route.ts` |
| G02 | Страница login ЛК | `src/app/(guest)/login/page.tsx` |
| G03 | Layout (guest): хедер + auth guard для /guest/* | `src/app/(guest)/layout.tsx` |
| G04 | Страница "Мои бронирования" | `src/app/(guest)/bookings/page.tsx` |
| G05 | Страница "Запросить услугу" | `src/app/(guest)/services/page.tsx` |

### Блок 4 — Staff operations portal
| ID | Задача | Файл |
|----|--------|------|
| SF01 | API: tasks CRUD | `src/app/api/tasks/` |
| SF02 | API: shifts (start/break/end) | `src/app/api/shifts/` |
| SF03 | Login страница (Авторизация.png) | `src/app/(staff)/login/page.tsx` |
| SF04 | Layout (staff): хедер с именем/временем/сменой | `src/app/(staff)/layout.tsx` |
| SF05 | Экран Номера (Номера.png) | `src/app/(staff)/rooms/page.tsx` |
| SF06 | Экран Задачи + Чеклист | `src/app/(staff)/tasks/page.tsx` |
| SF07 | Экран Сотрудники | `src/app/(staff)/employees/page.tsx` |
| SF08 | Форма Check-in (Регистрация поселенца.png) | `src/app/(staff)/checkin/page.tsx` |
| SF09 | Карточка гостя (Анкета поселенца.png) | `src/app/(staff)/checkin/[bookingId]/page.tsx` |
| SF10 | Мобильная адаптация всего staff portal | все (staff) |

---

## Definition of Done

- [ ] `/` — витрина отеля в зелёном стиле, каталог номеров из БД
- [ ] Гость регистрируется через ЛК, видит брони, может запросить услугу
- [ ] Сотрудник входит в staff portal, управляет задачами и номерами
- [ ] Check-in создаёт booking в CRM
- [ ] Staff portal работает на мобильном (Android-ширина)
- [ ] CRM `/app/*` не затронут
