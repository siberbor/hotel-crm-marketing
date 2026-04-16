"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardTitle, Badge, Input, Modal } from "@/components/ui";

interface Interaction {
  id: number;
  guestId: number;
  bookingId: number | null;
  type: "call" | "email" | "meeting" | "complaint" | "compliment";
  subject: string | null;
  content: string | null;
  createdAt: string;
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
}

const typeLabels: Record<
  string,
  {
    label: string;
    icon: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
  }
> = {
  call: { label: "Звонок", icon: "📞", variant: "info" },
  email: { label: "Email", icon: "✉️", variant: "default" },
  meeting: { label: "Встреча", icon: "🤝", variant: "success" },
  complaint: { label: "Жалоба", icon: "⚠️", variant: "danger" },
  compliment: { label: "Благодарность", icon: "⭐", variant: "warning" },
};

export default function InteractionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    guestId: "",
    type: "call" as Interaction["type"],
    subject: "",
    content: "",
  });

  const fetchData = async () => {
    try {
      const [interactionsRes, guestsRes] = await Promise.all([
        fetch("/api/interactions"),
        fetch("/api/guests"),
      ]);
      const interactionsData = await interactionsRes.json();
      const guestsData = await guestsRes.json();

      if (interactionsData.data) setInteractions(interactionsData.data);
      if (guestsData.data) setGuests(guestsData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ guestId: "", type: "call", subject: "", content: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating interaction:", error);
    }
  };

  const filteredInteractions = filterType
    ? interactions.filter((i) => i.type === filterType)
    : interactions;

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
            <CardTitle>История взаимодействий</CardTitle>
            <div className="flex gap-3">
              <select
                className="input w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Все типы</option>
                {Object.entries(typeLabels).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <Button onClick={() => setShowModal(true)}>+ Добавить</Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : filteredInteractions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Взаимодействий нет
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInteractions.map((interaction) => {
                const guest = guests.find((g) => g.id === interaction.guestId);
                const typeInfo = typeLabels[interaction.type] || {
                  label: interaction.type,
                  icon: "📌",
                  variant: "default" as const,
                };

                return (
                  <div
                    key={interaction.id}
                    className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-2xl">{typeInfo.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant={typeInfo.variant}>
                          {typeInfo.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {guest
                            ? `${guest.firstName} ${guest.lastName}`
                            : "Гость #" + interaction.guestId}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(interaction.createdAt).toLocaleString("ru")}
                        </span>
                      </div>
                      {interaction.subject && (
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {interaction.subject}
                        </p>
                      )}
                      {interaction.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {interaction.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Новое взаимодействие"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Добавить</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Гость
            </label>
            <select
              className="input"
              value={formData.guestId}
              onChange={(e) =>
                setFormData({ ...formData, guestId: e.target.value })
              }
            >
              <option value="">Выберите гостя</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.firstName} {g.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип
            </label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as Interaction["type"],
                })
              }
            >
              {Object.entries(typeLabels).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Тема"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Содержание
            </label>
            <textarea
              className="input min-h-[100px]"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
