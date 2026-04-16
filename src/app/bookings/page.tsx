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

interface Booking {
  id: number;
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  totalPrice: string;
  paidAmount: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  source: string | null;
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
}

interface Room {
  id: number;
  number: string;
  type: string;
  pricePerNight: string;
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
  }
> = {
  pending: { label: "Ожидает", variant: "warning" },
  confirmed: { label: "Подтверждено", variant: "info" },
  checked_in: { label: "Заселён", variant: "success" },
  checked_out: { label: "Выселен", variant: "default" },
  cancelled: { label: "Отменено", variant: "danger" },
};

export default function BookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    guestId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    totalPrice: "",
    source: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [bookingsRes, guestsRes, roomsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/guests"),
        fetch("/api/rooms"),
      ]);
      const bookingsData = await bookingsRes.json();
      const guestsData = await guestsRes.json();
      const roomsData = await roomsRes.json();

      if (bookingsData.data) setBookings(bookingsData.data);
      if (guestsData.data) setGuests(guestsData.data);
      if (roomsData.data) setRooms(roomsData.data);
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
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
        totalPrice: "",
        source: "",
        notes: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <CardTitle>Бронирования</CardTitle>
            <Button onClick={() => setShowModal(true)}>
              + Новое бронирование
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Бронирований нет
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Гость</TableHead>
                  <TableHead>Номер</TableHead>
                  <TableHead>Заезд</TableHead>
                  <TableHead>Выезд</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const guest = guests.find((g) => g.id === booking.guestId);
                  const room = rooms.find((r) => r.id === booking.roomId);
                  const statusInfo = statusLabels[booking.status] || {
                    label: booking.status,
                    variant: "default" as const,
                  };

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.id}</TableCell>
                      <TableCell>
                        {guest ? `${guest.firstName} ${guest.lastName}` : "-"}
                      </TableCell>
                      <TableCell>
                        {room ? `${room.number} (${room.type})` : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.checkInDate).toLocaleDateString("ru")}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.checkOutDate).toLocaleDateString(
                          "ru",
                        )}
                      </TableCell>
                      <TableCell>
                        ₽{parseInt(booking.totalPrice).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.paymentStatus === "paid"
                              ? "success"
                              : booking.paymentStatus === "partial"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {booking.paymentStatus === "paid"
                            ? "Оплачено"
                            : booking.paymentStatus === "partial"
                              ? "Частично"
                              : "Не оплачено"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === "pending" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(booking.id, "confirmed")
                              }
                            >
                              Подтвердить
                            </Button>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(booking.id, "checked_in")
                              }
                            >
                              Заселить
                            </Button>
                          )}
                          {booking.status === "checked_in" && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(booking.id, "checked_out")
                              }
                            >
                              Выселить
                            </Button>
                          )}
                          {(booking.status === "pending" ||
                            booking.status === "confirmed") && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(booking.id, "cancelled")
                              }
                            >
                              Отменить
                            </Button>
                          )}
                        </div>
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
        title="Новое бронирование"
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
              Номер
            </label>
            <select
              className="input"
              value={formData.roomId}
              onChange={(e) => {
                const room = rooms.find(
                  (r) => r.id === parseInt(e.target.value),
                );
                setFormData({
                  ...formData,
                  roomId: e.target.value,
                  totalPrice: room ? room.pricePerNight : "",
                });
              }}
            >
              <option value="">Выберите номер</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} - {r.type} (₽{r.pricePerNight}/ночь)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Заезд"
              type="date"
              value={formData.checkInDate}
              onChange={(e) =>
                setFormData({ ...formData, checkInDate: e.target.value })
              }
            />
            <Input
              label="Выезд"
              type="date"
              value={formData.checkOutDate}
              onChange={(e) =>
                setFormData({ ...formData, checkOutDate: e.target.value })
              }
            />
          </div>
          <Input
            label="Источник"
            value={formData.source}
            onChange={(e) =>
              setFormData({ ...formData, source: e.target.value })
            }
            placeholder="Booking.com, Прямая бронь..."
          />
          <Input
            label="Сумма"
            type="number"
            value={formData.totalPrice}
            onChange={(e) =>
              setFormData({ ...formData, totalPrice: e.target.value })
            }
          />
        </div>
      </Modal>
    </div>
  );
}
