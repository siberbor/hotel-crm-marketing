"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button, Card, CardTitle, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Input, Modal,
} from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { qk } from "@/lib/query-keys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  totalVisits: number;
  totalSpent: string;
}

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", notes: "" };

export default function GuestsPage() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: guestsData, isLoading } = useQuery({
    queryKey: qk.guests.list({ search: debouncedSearch }),
    queryFn: async () => {
      const url = debouncedSearch
        ? `/api/guests?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/guests";
      const res = await fetch(url);
      const json = await res.json();
      return (json.data ?? []) as Guest[];
    },
    enabled: !!user,
  });

  const guests = guestsData ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGuest) {
        return fetch(`/api/guests/${editingGuest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      return fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.guests.all });
      setShowModal(false);
      setEditingGuest(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/guests/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guests.all }),
  });

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({ firstName: guest.firstName, lastName: guest.lastName, email: guest.email || "", phone: guest.phone || "", notes: "" });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого гостя?")) return;
    deleteMutation.mutate(id);
  };

  if (!user) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hotel CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">{user.name}</span>
            <Badge variant="info">{user.role}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <CardTitle>Гости</CardTitle>
            <div className="flex gap-3 w-full sm:w-auto">
              <Input
                placeholder="Поиск по имени, email, телефону..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button onClick={() => { setEditingGuest(null); setFormData(EMPTY_FORM); setShowModal(true); }}>
                + Добавить
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : guests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Гости не найдены</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Фамилия</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Визитов</TableHead>
                  <TableHead>Потрачено</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell>{guest.id}</TableCell>
                    <TableCell>{guest.firstName}</TableCell>
                    <TableCell>{guest.lastName}</TableCell>
                    <TableCell>{guest.email || "-"}</TableCell>
                    <TableCell>{guest.phone || "-"}</TableCell>
                    <TableCell>{guest.totalVisits}</TableCell>
                    <TableCell>₽{parseInt(guest.totalSpent).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(guest)}>Изменить</Button>
                        {user.role === "admin" && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(guest.id)}>Удалить</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGuest ? "Редактировать гостя" : "Добавить гостя"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : editingGuest ? "Сохранить" : "Добавить"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Имя" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
          <Input label="Фамилия" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label="Телефон" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Заметки" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
