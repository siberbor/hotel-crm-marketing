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
  Input,
  Modal,
} from "@/components/ui";

interface Campaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sending" | "sent";
  scheduledAt: string | null;
  sentAt: string | null;
  stats: { sent: number; opened: number; clicked: number } | null;
  createdAt: string;
}

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "info" }
> = {
  draft: { label: "Черновик", variant: "default" },
  scheduled: { label: "Запланирована", variant: "warning" },
  sending: { label: "Отправляется", variant: "info" },
  sent: { label: "Отправлена", variant: "success" },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
  });

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.data) setCampaigns(data.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
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
    fetchCampaigns();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ name: "", subject: "", content: "" });
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleSend = async (id: number) => {
    try {
      await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      fetchCampaigns();
    } catch (error) {
      console.error("Error sending campaign:", error);
    }
  };

  const canSendCampaigns =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "marketing";

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
            <CardTitle>Email-кампании</CardTitle>
            {canSendCampaigns && (
              <Button onClick={() => setShowModal(true)}>
                + Новая кампания
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Кампаний нет</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправлено</TableHead>
                  <TableHead>Открытий</TableHead>
                  <TableHead>Кликов</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const statusInfo = statusLabels[campaign.status] || {
                    label: campaign.status,
                    variant: "default" as const,
                  };
                  const openRate = campaign.stats
                    ? Math.round(
                        (campaign.stats.opened / campaign.stats.sent) * 100,
                      )
                    : 0;
                  const clickRate = campaign.stats
                    ? Math.round(
                        (campaign.stats.clicked / campaign.stats.sent) * 100,
                      )
                    : 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.name}
                      </TableCell>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.stats?.sent || "-"}</TableCell>
                      <TableCell>
                        {campaign.stats ? (
                          <span
                            className={openRate > 30 ? "text-green-600" : ""}
                          >
                            {campaign.stats.opened} ({openRate}%)
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.stats ? (
                          <span
                            className={clickRate > 10 ? "text-green-600" : ""}
                          >
                            {campaign.stats.clicked} ({clickRate}%)
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.status === "draft" && canSendCampaigns && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSend(campaign.id)}
                          >
                            Отправить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Новая кампания"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Создать</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: Приглашение на выходные"
          />
          <Input
            label="Тема письма"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Например: Специальное предложение для вас!"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Содержание
            </label>
            <textarea
              className="input min-h-[200px]"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Текст письма..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
