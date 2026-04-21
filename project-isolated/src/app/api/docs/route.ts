import { NextResponse } from "next/server";

const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "Hotel CRM API",
    version: "1.0.0",
    description: "CRM система для управления отелем (~50 номеров)",
  },
  servers: [{ url: "http://localhost:3000", description: "Development" }],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          data: { type: "array", items: {} },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Аутентификация",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Успешный вход, устанавливает cookie token" },
          401: { description: "Неверные credentials" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Выход из системы",
        responses: { 200: { description: "Сессия завершена" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Текущий пользователь",
        responses: {
          200: {
            description: "Данные авторизованного пользователя",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            email: { type: "string" },
                            name: { type: "string" },
                            role: { type: "string", enum: ["admin", "manager", "marketing", "receptionist"] },
                            onboardingCompleted: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Не авторизован" },
        },
      },
      patch: {
        tags: ["Auth"],
        summary: "Завершить онбординг",
        description: "Устанавливает onboarding_completed=true для текущего пользователя",
        responses: {
          200: { description: "Онбординг помечен завершённым" },
          401: { description: "Не авторизован" },
        },
      },
    },
    "/api/guests": {
      get: {
        tags: ["Guests"],
        summary: "Список гостей",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Поиск по имени, email, телефону" },
        ],
        responses: { 200: { description: "Список гостей с пагинацией" } },
      },
      post: {
        tags: ["Guests"],
        summary: "Создать гостя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName"],
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  notes: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  preferences: { type: "object" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Гость создан" } },
      },
    },
    "/api/guests/{id}": {
      get: {
        tags: ["Guests"],
        summary: "Получить гостя",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Данные гостя" }, 404: { description: "Не найден" } },
      },
      patch: {
        tags: ["Guests"],
        summary: "Обновить гостя",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Гость обновлён" }, 429: { description: "Rate limit" } },
      },
      delete: {
        tags: ["Guests"],
        summary: "Удалить гостя (только admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалён" }, 403: { description: "Нет прав" } },
      },
    },
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "Список бронирований",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled"] } },
          { name: "guestId", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Бронирования" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Создать бронирование",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["guestId", "roomId", "checkInDate", "checkOutDate"],
                properties: {
                  guestId: { type: "integer" },
                  roomId: { type: "integer" },
                  checkInDate: { type: "string", format: "date-time" },
                  checkOutDate: { type: "string", format: "date-time" },
                  source: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Бронирование создано" },
          409: { description: "Конфликт дат" },
        },
      },
    },
    "/api/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Получить бронирование",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Данные бронирования" }, 404: { description: "Не найдено" } },
      },
      patch: {
        tags: ["Bookings"],
        summary: "Обновить бронирование / сменить статус",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Обновлено" }, 429: { description: "Rate limit" } },
      },
      delete: {
        tags: ["Bookings"],
        summary: "Удалить бронирование",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалено" } },
      },
    },
    "/api/rooms": {
      get: {
        tags: ["Rooms"],
        summary: "Список номеров",
        responses: { 200: { description: "Все активные номера" } },
      },
    },
    "/api/interactions": {
      get: {
        tags: ["Interactions"],
        summary: "Список взаимодействий",
        parameters: [
          { name: "guestId", in: "query", schema: { type: "integer" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["call", "email", "meeting", "complaint", "compliment"] } },
        ],
        responses: { 200: { description: "Взаимодействия" } },
      },
      post: {
        tags: ["Interactions"],
        summary: "Создать взаимодействие",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["guestId", "type", "notes"],
                properties: {
                  guestId: { type: "integer" },
                  bookingId: { type: "integer" },
                  type: { type: "string", enum: ["call", "email", "meeting", "complaint", "compliment"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Создано" } },
      },
    },
    "/api/interactions/{id}": {
      get: {
        tags: ["Interactions"],
        summary: "Получить взаимодействие",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Данные" }, 404: { description: "Не найдено" } },
      },
      delete: {
        tags: ["Interactions"],
        summary: "Удалить взаимодействие",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалено" }, 429: { description: "Rate limit" } },
      },
    },
    "/api/campaigns": {
      get: {
        tags: ["Campaigns"],
        summary: "Список кампаний",
        responses: { 200: { description: "Кампании" } },
      },
      post: {
        tags: ["Campaigns"],
        summary: "Создать кампанию",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "subject", "body"],
                properties: {
                  name: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" },
                  segmentId: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Кампания создана" } },
      },
    },
    "/api/campaigns/{id}": {
      get: {
        tags: ["Campaigns"],
        summary: "Получить кампанию",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Данные кампании" }, 404: { description: "Не найдена" } },
      },
      patch: {
        tags: ["Campaigns"],
        summary: "Обновить кампанию",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Обновлена" }, 429: { description: "Rate limit" } },
      },
      delete: {
        tags: ["Campaigns"],
        summary: "Удалить кампанию",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Удалена" } },
      },
    },
    "/api/campaigns/{id}/send": {
      post: {
        tags: ["Campaigns"],
        summary: "Отправить кампанию",
        description: "Ставит задачу в BullMQ очередь для отправки через Resend",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Кампания поставлена в очередь" },
          403: { description: "Нет прав (нужен admin/manager/marketing)" },
        },
      },
    },
    "/api/segments": {
      get: {
        tags: ["Segments"],
        summary: "Список сегментов гостей",
        responses: { 200: { description: "Сегменты" } },
      },
    },
    "/api/search": {
      get: {
        tags: ["Search"],
        summary: "Глобальный поиск",
        description: "PostgreSQL FTS. Debounce 300ms на фронте.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Поисковый запрос" },
        ],
        responses: { 200: { description: "Результаты поиска по гостям, бронированиям, кампаниям" } },
      },
    },
    "/api/channels": {
      get: {
        tags: ["Channels"],
        summary: "Лог синхронизации с каналами",
        responses: { 200: { description: "Записи sync_logs" } },
      },
      post: {
        tags: ["Channels"],
        summary: "Запустить синхронизацию канала",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: { type: "string", description: "Название канала (Booking.com, Airbnb, ...)" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Синхронизация запущена через BullMQ" } },
      },
    },
    "/api/reports": {
      get: {
        tags: ["Reports"],
        summary: "Сводный отчёт",
        description: "Тяжёлый запрос. Кешируется 1 час. Только admin/manager.",
        responses: {
          200: { description: "Обзор, топ-источники, выручка" },
          403: { description: "Нет прав" },
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Непрочитанные уведомления",
        responses: { 200: { description: "Список уведомлений" } },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: {
          200: { description: "Сервис работает, статус БД и Redis" },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(OPENAPI_SPEC);
}
