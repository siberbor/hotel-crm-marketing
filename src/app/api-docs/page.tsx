"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/auth/login",
    description: "Аутентификация",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    description: "Выход",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/auth/me",
    description: "Текущий пользователь",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/guests",
    description: "Список гостей",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/guests",
    description: "Создать гостя",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/guests/[id]",
    description: "Получить гостя",
    status: "✅",
  },
  {
    method: "PATCH",
    path: "/api/guests/[id]",
    description: "Обновить гостя",
    status: "✅",
  },
  {
    method: "DELETE",
    path: "/api/guests/[id]",
    description: "Удалить гостя",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/bookings",
    description: "Список бронирований",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/bookings",
    description: "Создать бронирование",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/rooms",
    description: "Список номеров",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/interactions",
    description: "Взаимодействия",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/interactions",
    description: "Создать взаимодействие",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/campaigns",
    description: "Кампании",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/campaigns",
    description: "Создать кампанию",
    status: "✅",
  },
  {
    method: "POST",
    path: "/api/campaigns/[id]/send",
    description: "Отправить кампанию",
    status: "✅",
  },
  { method: "GET", path: "/api/reports", description: "Отчёты", status: "✅" },
  { method: "GET", path: "/api/search", description: "Поиск", status: "✅" },
  {
    method: "GET",
    path: "/api/segments",
    description: "Сегменты",
    status: "✅",
  },
  { method: "GET", path: "/api/channels", description: "Каналы", status: "✅" },
  {
    method: "POST",
    path: "/api/channels",
    description: "Синхронизация",
    status: "✅",
  },
  {
    method: "GET",
    path: "/api/health",
    description: "Health check",
    status: "✅",
  },
];

export default function ApiDocsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.data?.user))
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Hotel CRM
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.name}
            </span>
            <Badge variant="info">{user.role}</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          API Документация
        </h1>

        <Card>
          <CardTitle className="mb-4">Доступные эндпоинты</CardTitle>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Метод</TableHead>
                <TableHead>Путь</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENDPOINTS.map((endpoint, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge
                      variant={
                        endpoint.method === "GET"
                          ? "info"
                          : endpoint.method === "POST"
                            ? "success"
                            : endpoint.method === "PATCH"
                              ? "warning"
                              : "danger"
                      }
                    >
                      {endpoint.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {endpoint.path}
                  </TableCell>
                  <TableCell>{endpoint.description}</TableCell>
                  <TableCell>{endpoint.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
