import { NextResponse } from "next/server";

const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "Hotel CRM API",
    version: "1.0.0",
    description: "CRM система для управления отелем",
  },
  servers: [{ url: "http://localhost:3000", description: "Development" }],
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Аутентификация",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Успешный вход" },
          401: { description: "Неверные credentials" },
        },
      },
    },
    "/api/guests": {
      get: {
        summary: "Получить список гостей",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
      },
      post: {
        summary: "Создать гостя",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    "/api/bookings": {
      get: { summary: "Получить бронирования" },
      post: { summary: "Создать бронирование" },
    },
    "/api/reports": {
      get: { summary: "Получить отчёты" },
    },
    "/api/health": {
      get: { summary: "Health check" },
    },
  },
};

export function GET() {
  return NextResponse.json(OPENAPI_SPEC);
}
