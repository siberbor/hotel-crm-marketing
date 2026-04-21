"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Modal, Input } from "@/components/ui";

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
  email: string | null;
  phone: string | null;
}

interface Room {
  id: number;
  number: string;
  type: string;
  pricePerNight: string;
  capacity: number;
}

const STATUS_CONFIG = {
  pending:    { label: "Ожидает",    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed:  { label: "Подтверждено", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  checked_in: { label: "Заселён",    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  checked_out:{ label: "Выселен",    color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  cancelled:  { label: "Отменено",   color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const PAYMENT_CONFIG = {
  paid:    { label: "Оплачено",   color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  partial: { label: "Частично",   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  unpaid:  { label: "Не оплачено",color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

function PaymentBadge({ status }: { status: keyof typeof PAYMENT_CONFIG }) {
  const cfg = PAYMENT_CONFIG[status] ?? PAYMENT_CONFIG.unpaid;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [guestSearch, setGuestSearch] = useState("");
  const [guestResults, setGuestResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    totalPrice: "",
    source: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, guestsRes, roomsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/guests?limit=100"),
        fetch("/api/rooms"),
      ]);
      const [bd, gd, rd] = await Promise.all([bookingsRes.json(), guestsRes.json(), roomsRes.json()]);
      if (bd.data) setBookings(bd.data);
      if (gd.data) setGuests(gd.data);
      if (rd.data) setRooms(rd.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Поиск гостей с debounce
  useEffect(() => {
    if (!guestSearch.trim()) { setGuestResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/guests?search=${encodeURIComponent(guestSearch)}`);
      const data = await res.json();
      if (data.data) setGuestResults(data.data);
    }, 300);
    return () => clearTimeout(timer);
  }, [guestSearch]);

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((r) => r.id === parseInt(roomId));
    setFormData((f) => ({ ...f, roomId, totalPrice: room ? room.pricePerNight : f.totalPrice }));
  };

  const handleSave = async () => {
    if (!selectedGuest) { setError("Выберите гостя"); return; }
    if (!formData.roomId) { setError("Выберите номер"); return; }
    if (!formData.checkInDate || !formData.checkOutDate) { setError("Укажите даты"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, guestId: selectedGuest.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message || "Ошибка создания");
        return;
      }
      closeModal();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGuest(null);
    setGuestSearch("");
    setGuestResults([]);
    setError("");
    setFormData({ roomId: "", checkInDate: "", checkOutDate: "", totalPrice: "", source: "" });
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const filtered = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus);

  const guestName = (id: number) => {
    const g = guests.find((g) => g.id === id);
    return g ? `${g.firstName} ${g.lastName}` : `#${id}`;
  };

  const roomLabel = (id: number) => {
    const r = rooms.find((r) => r.id === id);
    return r ? `№${r.number} · ${r.type}` : `#${id}`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });

  const nights = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    return Math.max(0, Math.round((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / 86400000));
  };

  return (
    <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Бронирования</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{bookings.length} всего</p>
          </div>
          <Button onClick={() => setShowModal(true)} disabled={loading} className="gap-2">
            {loading ? (
              <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Загрузка...</>
            ) : (
              <><span className="text-base leading-none">+</span> Новое бронирование</>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { value: "all", label: "Все" },
            { value: "pending", label: "Ожидают" },
            { value: "confirmed", label: "Подтверждены" },
            { value: "checked_in", label: "Заселены" },
            { value: "checked_out", label: "Выселены" },
            { value: "cancelled", label: "Отменены" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
            >
              {f.label}
              {f.value !== "all" && (
                <span className={`ml-1.5 text-xs ${filterStatus === f.value ? "opacity-80" : "text-gray-400"}`}>
                  {bookings.filter((b) => b.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm">Нет бронирований</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {["ID", "Гость", "Номер", "Заезд → Выезд", "Ночей", "Сумма", "Статус", "Оплата", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {filtered.map((b) => {
                    const n = Math.round((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{b.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{guestName(b.guestId)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{roomLabel(b.roomId)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{n}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          ₽{parseInt(b.totalPrice).toLocaleString("ru")}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3"><PaymentBadge status={b.paymentStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {b.status === "pending" && (
                              <button onClick={() => handleStatusChange(b.id, "confirmed")} className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap">
                                Подтвердить
                              </button>
                            )}
                            {b.status === "confirmed" && (
                              <button onClick={() => handleStatusChange(b.id, "checked_in")} className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 transition-colors whitespace-nowrap">
                                Заселить
                              </button>
                            )}
                            {b.status === "checked_in" && (
                              <button onClick={() => handleStatusChange(b.id, "checked_out")} className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap">
                                Выселить
                              </button>
                            )}
                            {(b.status === "pending" || b.status === "confirmed") && (
                              <button onClick={() => handleStatusChange(b.id, "cancelled")} className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors">
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Новое бронирование"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : "Создать бронирование"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Guest search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Гость</label>
            {selectedGuest ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{selectedGuest.firstName} {selectedGuest.lastName}</p>
                  {selectedGuest.phone && <p className="text-xs text-gray-500">{selectedGuest.phone}</p>}
                </div>
                <button onClick={() => setSelectedGuest(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {guestResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {guestResults.slice(0, 5).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setSelectedGuest(g); setGuestSearch(""); setGuestResults([]); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-semibold flex-shrink-0">
                          {g.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.firstName} {g.lastName}</p>
                          {g.phone && <p className="text-xs text-gray-400">{g.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {guestSearch && guestResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-center text-sm text-gray-400">
                    Гости не найдены
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Номер</label>
            <select
              value={formData.roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{loading ? "Загрузка номеров..." : rooms.length === 0 ? "Нет доступных номеров" : "Выберите номер"}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  №{r.number} · {r.type} · ₽{parseInt(r.pricePerNight).toLocaleString("ru")}/ночь · {r.capacity} чел.
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Заезд</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData((f) => ({ ...f, checkInDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Выезд</label>
              <input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => setFormData((f) => ({ ...f, checkOutDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price summary */}
          {nights() > 0 && formData.totalPrice && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">{nights()} {nights() === 1 ? "ночь" : nights() < 5 ? "ночи" : "ночей"} × ₽{parseInt(formData.totalPrice).toLocaleString("ru")}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">₽{(nights() * parseInt(formData.totalPrice)).toLocaleString("ru")}</span>
            </div>
          )}

          <Input
            label="Источник бронирования"
            value={formData.source}
            onChange={(e) => setFormData((f) => ({ ...f, source: e.target.value }))}
            placeholder="Booking.com, Прямая бронь, Телефон..."
          />

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
