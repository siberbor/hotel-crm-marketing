"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/tokens-green.css";

interface BookingOption {
  id: number;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
}

interface Props {
  bookings: BookingOption[];
  categories: string[];
}

export default function GuestServiceForm({ bookings, categories }: Props) {
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState(bookings[0]?.id ?? 0);
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/guest/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: category,
          content: content.trim(),
          bookingId: selectedBooking,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Ошибка отправки");
        return;
      }

      setSuccess(true);
      setContent("");
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        background: "#fff", borderRadius: 12, padding: 48,
        textAlign: "center", border: "1px solid var(--g-border)",
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Запрос отправлен!</h2>
        <p style={{ color: "var(--g-text-secondary)", marginBottom: 28, fontSize: 14 }}>
          Наши сотрудники свяжутся с вами в течение 15 минут.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setSuccess(false)}
            style={{
              background: "var(--g-primary)", color: "#fff",
              padding: "10px 20px", borderRadius: 8,
              fontWeight: 600, border: "none", cursor: "pointer", fontSize: 14,
            }}
          >
            Ещё один запрос
          </button>
          <button
            onClick={() => router.push("/guest/bookings")}
            style={{
              background: "transparent", color: "var(--g-text-secondary)",
              padding: "10px 20px", borderRadius: 8,
              fontWeight: 500, border: "1px solid var(--g-border)", cursor: "pointer", fontSize: 14,
            }}
          >
            Мои бронирования
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 32,
      border: "1px solid var(--g-border)",
    }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Booking select */}
        {bookings.length > 1 && (
          <div>
            <label className="g-label">Бронирование</label>
            <select
              className="g-input"
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(Number(e.target.value))}
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Номер {b.roomNumber} · {b.checkInDate} – {b.checkOutDate}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="g-label">Категория услуги</label>
          <select
            className="g-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="g-label">Пожелания</label>
          <textarea
            className="g-input"
            placeholder="Опишите ваш запрос подробнее..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 8, padding: "10px 14px",
            color: "#dc2626", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="g-btn-primary"
          disabled={loading || !content.trim()}
        >
          {loading ? "Отправляем..." : "Отправить запрос"}
        </button>
      </form>
    </div>
  );
}
