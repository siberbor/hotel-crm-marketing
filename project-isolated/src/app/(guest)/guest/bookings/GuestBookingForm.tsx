"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили сюит",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

interface Room {
  id: number;
  number: string;
  type: string;
  floor: number;
  pricePerNight: string;
  capacity: number;
  amenities: string[] | null;
}

export default function GuestBookingForm() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"dates" | "rooms" | "confirm">("dates");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
        )
      : 0;

  const totalPrice =
    selectedRoom && nights > 0
      ? (parseFloat(selectedRoom.pricePerNight) * nights).toFixed(2)
      : "0";

  async function searchRooms() {
    setError("");
    setLoading(true);
    setSelectedRoom(null);
    try {
      const res = await fetch(
        `/api/guest/rooms?checkIn=${checkIn}&checkOut=${checkOut}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Ошибка поиска номеров");
        return;
      }
      setRooms(data.data);
      setStep("rooms");
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking() {
    if (!selectedRoom) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/guest/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          checkIn,
          checkOut,
          totalPrice,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Ошибка бронирования");
        return;
      }
      // Success — refresh page to show new booking
      router.refresh();
      setOpen(false);
      resetForm();
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCheckIn("");
    setCheckOut("");
    setRooms([]);
    setSelectedRoom(null);
    setNotes("");
    setStep("dates");
    setError("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "var(--g-primary)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 28px",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        + Новое бронирование
      </button>
    );
  }

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid var(--g-primary)",
      borderRadius: 12,
      padding: 28,
      marginBottom: 32,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Новое бронирование</h2>
        <button
          onClick={() => { setOpen(false); resetForm(); }}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9E9E9E" }}
        >
          ×
        </button>
      </div>

      {/* Step 1: dates */}
      {step === "dates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#424242" }}>
                Дата заезда
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) setCheckOut("");
                }}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1.5px solid #E0E0E0", fontSize: 14, boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#424242" }}>
                Дата выезда
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1.5px solid #E0E0E0", fontSize: 14, boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {nights > 0 && (
            <p style={{ fontSize: 13, color: "var(--g-text-secondary)", margin: 0 }}>
              Продолжительность: <strong>{nights} ночей</strong>
            </p>
          )}

          {error && <ErrorBox message={error} />}

          <button
            onClick={searchRooms}
            disabled={!checkIn || !checkOut || nights <= 0 || loading}
            style={{
              background: "var(--g-primary)", color: "#fff", border: "none",
              borderRadius: 8, padding: "12px", fontWeight: 600, fontSize: 15,
              cursor: "pointer", opacity: (!checkIn || !checkOut || nights <= 0) ? 0.5 : 1,
            }}
          >
            {loading ? "Поиск..." : "Найти свободные номера"}
          </button>
        </div>
      )}

      {/* Step 2: room selection */}
      {step === "rooms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "var(--g-text-secondary)", margin: 0 }}>
              {checkIn} — {checkOut} · {nights} ночей
            </p>
            <button
              onClick={() => { setStep("dates"); setSelectedRoom(null); }}
              style={{ background: "none", border: "none", color: "var(--g-primary)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              ← Изменить даты
            </button>
          </div>

          {rooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9E9E9E" }}>
              Нет свободных номеров на выбранные даты
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => { setSelectedRoom(room); setStep("confirm"); }}
                  style={{
                    background: "#F9FBF5",
                    border: "1.5px solid #E0E0E0",
                    borderRadius: 10, padding: "14px 18px",
                    textAlign: "left", cursor: "pointer",
                    transition: "border-color .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--g-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E0E0E0")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Номер {room.number}</span>
                      <span style={{ marginLeft: 10, fontSize: 13, color: "#757575" }}>
                        {ROOM_TYPE_LABELS[room.type] ?? room.type} · {room.floor} этаж
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--g-primary)", fontSize: 15 }}>
                      {Number(room.pricePerNight).toLocaleString("ru-RU")} ₽/ночь
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && <ErrorBox message={error} />}
        </div>
      )}

      {/* Step 3: confirm */}
      {step === "confirm" && selectedRoom && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button
            onClick={() => { setStep("rooms"); }}
            style={{ background: "none", border: "none", color: "var(--g-primary)", fontSize: 13, cursor: "pointer", fontWeight: 600, textAlign: "left", padding: 0 }}
          >
            ← Выбрать другой номер
          </button>

          <div style={{
            background: "#F9FBF5", border: "1px solid var(--g-border)",
            borderRadius: 10, padding: "16px 20px",
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              Номер {selectedRoom.number} · {ROOM_TYPE_LABELS[selectedRoom.type] ?? selectedRoom.type}
            </div>
            <div style={{ color: "#757575", fontSize: 13, marginBottom: 8 }}>
              {checkIn} — {checkOut} · {nights} ночей
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--g-primary)" }}>
              {Number(totalPrice).toLocaleString("ru-RU")} ₽
            </div>
            <div style={{ fontSize: 12, color: "#9E9E9E", marginTop: 2 }}>
              {Number(selectedRoom.pricePerNight).toLocaleString("ru-RU")} ₽ × {nights} ночей
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#424242" }}>
              Пожелания (необязательно)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ранний заезд, высокий этаж, детская кроватка..."
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #E0E0E0", fontSize: 14,
                resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>

          {error && <ErrorBox message={error} />}

          <button
            onClick={confirmBooking}
            disabled={loading}
            style={{
              background: "var(--g-primary)", color: "#fff", border: "none",
              borderRadius: 8, padding: "14px", fontWeight: 700, fontSize: 16,
              cursor: "pointer",
            }}
          >
            {loading ? "Оформление..." : "Подтвердить бронирование"}
          </button>

          <p style={{ fontSize: 12, color: "#9E9E9E", textAlign: "center", margin: 0 }}>
            Бронирование будет со статусом «Ожидает» до подтверждения администратором
          </p>
        </div>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca",
      borderRadius: 8, padding: "10px 14px",
      color: "#dc2626", fontSize: 13,
    }}>
      {message}
    </div>
  );
}
