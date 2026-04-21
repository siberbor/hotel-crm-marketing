"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { qk } from "@/lib/query-keys";
import { Button, Card, CardTitle, Badge, Input, Modal } from "@/components/ui";

interface Segment {
  id: number;
  name: string;
  type: "manual" | "auto";
  criteria: Record<string, unknown> | null;
  guestCount: number;
}

const EMPTY_FORM = { name: "", type: "manual" as "manual" | "auto" };

export default function SegmentsPage() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: segments = [], isLoading: loading } = useQuery({
    queryKey: qk.segments.list(),
    queryFn: () => fetch("/api/segments").then((r) => r.json()).then((d) => (d.data ?? []) as Segment[]),
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: () => fetch("/api/segments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.segments.all }); setShowModal(false); setFormData(EMPTY_FORM); },
  });

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
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <CardTitle>Сегменты гостей</CardTitle>
            <Button onClick={() => setShowModal(true)}>+ Новый сегмент</Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : segments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Сегментов нет</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {segment.name}
                    </h3>
                    <Badge
                      variant={segment.type === "auto" ? "info" : "default"}
                    >
                      {segment.type === "auto" ? "Авто" : "Ручной"}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {segment.guestCount}
                  </p>
                  <p className="text-sm text-gray-500">гостей</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Новый сегмент"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Создать"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: VIP гости"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип сегмента
            </label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "manual" | "auto",
                })
              }
            >
              <option value="manual">Ручной</option>
              <option value="auto">Автоматический</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
