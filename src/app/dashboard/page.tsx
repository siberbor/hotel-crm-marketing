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

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  totalVisits: number;
}

interface Booking {
  id: number;
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalPrice: string;
  paymentStatus: string;
}

interface Stats {
  guestsToday: number;
  totalBookings: number;
  occupancy: number;
  revenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [, setLoading] = useState(true);

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
    Promise.all([
      fetch("/api/guests").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ]).then(([guestsData, bookingsData]) => {
      if (guestsData.data) setGuests(guestsData.data);
      if (bookingsData.data) setBookings(bookingsData.data);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const stats: Stats = {
    guestsToday: bookings.filter((b) => {
      const today = new Date().toISOString().split("T")[0];
      return b.checkInDate.startsWith(today);
    }).length,
    totalBookings: bookings.length,
    occupancy:
      Math.round(
        (bookings.filter((b) => b.status === "checked_in").length / 50) * 100,
      ) || 0,
    revenue: bookings.reduce(
      (sum, b) => sum + parseInt(b.totalPrice || "0"),
      0,
    ),
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Заезд сегодня
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.guestsToday}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Всего бронирований
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.totalBookings}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Загруженность
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.occupancy}%
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400">Выручка</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              ₽{stats.revenue.toLocaleString()}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card padding="none">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <CardTitle>Последние гости</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/guests")}
              >
                Все гости →
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Визитов</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.slice(0, 5).map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell>
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell>{guest.email || "-"}</TableCell>
                    <TableCell>{guest.totalVisits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card padding="none">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <CardTitle>Активные бронирования</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/bookings")}
              >
                Все бронирования →
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Заезд</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 5).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>#{booking.id}</TableCell>
                    <TableCell>
                      {new Date(booking.checkInDate).toLocaleDateString("ru")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "info"
                            : booking.status === "checked_in"
                              ? "success"
                              : "default"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => router.push("/guests")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Гости
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {guests.length}
            </p>
            <p className="text-xs text-blue-600 mt-2">Управление гостями →</p>
          </Card>
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => router.push("/bookings")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Бронирования
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {bookings.length}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Управление бронированиями →
            </p>
          </Card>
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => router.push("/bookings")}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Номера
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              5
            </p>
            <p className="text-xs text-blue-600 mt-2">Свободные номера →</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
