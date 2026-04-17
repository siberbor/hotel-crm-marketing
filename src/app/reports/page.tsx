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

interface ReportData {
  overview: {
    totalGuests: number;
    totalBookings: number;
    occupancy: number;
    totalRevenue: number;
    paidRevenue: number;
    avgGuestSpent: number;
  };
  topSources: [string, number][];
  recentRevenue: { id: number; amount: number; date: string }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.data?.user))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setReport(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const canViewFinancials = user?.role === "admin" || user?.role === "manager";

  if (!user) return <div className="p-8">Загрузка...</div>;

  if (!canViewFinancials) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500">У вас нет доступа к отчётам</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.push("/dashboard")}
          >
            На главную
          </Button>
        </Card>
      </div>
    );
  }

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
          Отчёты и аналитика
        </h1>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Всего гостей
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {report.overview.totalGuests}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Всего бронирований
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {report.overview.totalBookings}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Загруженность
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {report.overview.occupancy}%
                </p>
              </Card>
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Выручка
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  ₽{report.overview.totalRevenue.toLocaleString()}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardTitle className="mb-4">Источники бронирований</CardTitle>
                {report.topSources.length > 0 ? (
                  <div className="space-y-3">
                    {report.topSources.map(([source, count], _i) => (
                      <div
                        key={source}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {source}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${(count / report.topSources[0][1]) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Нет данных</p>
                )}
              </Card>

              <Card>
                <CardTitle className="mb-4">Финансы</CardTitle>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Общая выручка
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ₽{report.overview.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Оплачено
                    </span>
                    <span className="font-semibold text-green-600">
                      ₽{report.overview.paidRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">
                      Средний чек на гостя
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ₽{report.overview.avgGuestSpent.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <Card padding="none">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Последние транзакции</CardTitle>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.recentRevenue.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>#{r.id}</TableCell>
                      <TableCell>
                        {new Date(r.date).toLocaleDateString("ru")}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₽{r.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">Нет данных</div>
        )}
      </main>
    </div>
  );
}
