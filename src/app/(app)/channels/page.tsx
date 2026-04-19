"use client";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { qk } from "@/lib/query-keys";
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

interface SyncLog {
  id: number;
  channel: string;
  externalId: string | null;
  action: string;
  status: "success" | "failed" | "pending";
  errorMessage: string | null;
  createdAt: string;
}

const CHANNELS = [
  { id: "Booking.com", name: "Booking.com", icon: "🏨", connected: true },
  { id: "Airbnb", name: "Airbnb", icon: "🏠", connected: true },
  { id: "Expedia", name: "Expedia", icon: "✈️", connected: false },
];

export default function ChannelsPage() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey: qk.channels.logs(),
    queryFn: () => fetch("/api/channels").then((r) => r.json()).then((d) => (d.data ?? []) as SyncLog[]),
    enabled: !!user,
  });

  const syncMutation = useMutation({
    mutationFn: (type: string) => fetch("/api/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.channels.logs() }),
  });

  const handleSync = (channel: string) => syncMutation.mutate(channel);
  const syncing = syncMutation.isPending ? "syncing" : null;
  const canManageChannels = user?.role === "admin" || user?.role === "manager";

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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Интеграции
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {CHANNELS.map((channel) => (
            <Card key={channel.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{channel.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {channel.name}
                    </h3>
                    <Badge variant={channel.connected ? "success" : "default"}>
                      {channel.connected ? "Подключён" : "Не подключён"}
                    </Badge>
                  </div>
                </div>
              </div>
              {canManageChannels && channel.connected && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleSync(channel.id)}
                  disabled={syncing === channel.id}
                >
                  {syncing === channel.id
                    ? "Синхронизация..."
                    : "Синхронизировать"}
                </Button>
              )}
            </Card>
          ))}
        </div>

        <Card>
          <CardTitle className="mb-4">История синхронизаций</CardTitle>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Нет данных</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Канал</TableHead>
                  <TableHead>Внешний ID</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Ошибка</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.channel}</TableCell>
                    <TableCell>{log.externalId || "-"}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "success"
                            ? "success"
                            : log.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {log.status === "success"
                          ? "Успешно"
                          : log.status === "pending"
                            ? "В процессе"
                            : "Ошибка"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.errorMessage || "-"}</TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString("ru")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
    </div>
  );
}
