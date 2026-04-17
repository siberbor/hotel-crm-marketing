"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  totalVisits: number;
}

interface Booking {
  id: number;
  guestId: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalPrice: string;
  paymentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  checked_in: "Заселён",
  checked_out: "Выселен",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  checked_in: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  checked_out: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/guests?limit=100").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ]).then(([gd, bd]) => {
      if (gd.data) setGuests(gd.data);
      if (bd.data) setBookings(bd.data);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const stats = [
    {
      label: "Заезд сегодня",
      value: bookings.filter((b) => b.checkInDate.startsWith(today)).length,
      icon: "📥",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Заселены сейчас",
      value: bookings.filter((b) => b.status === "checked_in").length,
      icon: "🏨",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Загруженность",
      value: `${Math.min(100, Math.round((bookings.filter((b) => b.status === "checked_in").length / 10) * 100))}%`,
      icon: "📊",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Выручка (всего)",
      value: `₽${bookings.reduce((s, b) => s + parseInt(b.totalPrice || "0"), 0).toLocaleString("ru")}`,
      icon: "💰",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Дашборд</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent guests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Последние гости</h2>
              <Link href="/guests" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Все →</Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {guests.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-semibold flex-shrink-0">
                    {g.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{g.firstName} {g.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{g.email || "—"}</p>
                  </div>
                  <span className="text-xs text-gray-400">{g.totalVisits} визитов</span>
                </div>
              ))}
              {guests.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 text-center">Нет гостей</p>}
            </div>
          </div>

          {/* Recent bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Активные бронирования</h2>
              <Link href="/bookings" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Все →</Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {bookings.filter((b) => b.status !== "cancelled" && b.status !== "checked_out").slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-mono text-gray-400 w-8">#{b.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(b.checkInDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })} → {new Date(b.checkOutDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || ""}`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">₽{parseInt(b.totalPrice).toLocaleString("ru")}</span>
                </div>
              ))}
              {bookings.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 text-center">Нет бронирований</p>}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/guests", label: "Гости", count: guests.length, icon: "👤" },
            { href: "/bookings", label: "Бронирования", count: bookings.length, icon: "📅" },
            { href: "/campaigns", label: "Кампании", count: null, icon: "📧" },
            { href: "/reports", label: "Отчёты", count: null, icon: "📊" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <span className="text-2xl block mb-2">{item.icon}</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.label}</p>
              {item.count !== null && <p className="text-xs text-gray-400 mt-0.5">{item.count} записей</p>}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
