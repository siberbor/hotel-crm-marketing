"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/tokens-green.css";

interface RoomOption {
  id: number;
  number: string;
  type: string;
  capacity: number;
}

interface Props {
  rooms: RoomOption[];
  preselectedRoomId?: number;
  services: string[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили сюит",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

export default function StaffCheckinForm({ rooms, preselectedRoomId, services }: Props) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(preselectedRoomId ?? rooms[0]?.id ?? 0);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  // Guest 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [passport, setPassport] = useState("");

  // Guest 2 (companion)
  const [firstName2, setFirstName2] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [patronymic2, setPatronymic2] = useState("");
  const [passport2, setPassport2] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [wishes, setWishes] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s: string) =>
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create or find guest
      const guestRes = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          notes: [
            patronymic ? `Отчество: ${patronymic}` : "",
            passport ? `Паспорт: ${passport}` : "",
            `${firstName2} ${lastName2}`.trim() ? `Спутник: ${firstName2} ${lastName2} ${patronymic2}, паспорт: ${passport2}` : "",
            selectedServices.length ? `Доп. услуги: ${selectedServices.join(", ")}` : "",
            wishes ? `Пожелания: ${wishes}` : "",
          ].filter(Boolean).join("\n"),
        }),
      });
      const guestData = await guestRes.json();
      if (!guestRes.ok) throw new Error(guestData.error?.message || "Ошибка создания гостя");

      const guestId = guestData.data?.id;
      if (!guestId) throw new Error("Не получен ID гостя");

      // 2. Create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: "0",
          source: "reception",
          notes: doNotDisturb ? "Не беспокоить" : (wishes || ""),
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error?.message || "Ошибка создания бронирования");

      router.push(`/staff/checkin/${guestId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid var(--g-border)", overflow: "hidden",
      }}>
        {/* Room header */}
        <div style={{
          background: "#f5f5f5", padding: "16px 24px",
          borderBottom: "1px solid var(--g-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <select
              value={roomId}
              onChange={(e) => setRoomId(Number(e.target.value))}
              style={{
                fontSize: 18, fontWeight: 700, background: "transparent",
                border: "none", cursor: "pointer", color: "var(--g-text)",
              }}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {ROOM_TYPE_LABELS[r.type] ?? r.type} №{r.number}
                </option>
              ))}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            Не беспокоить
            <div
              onClick={() => setDoNotDisturb(!doNotDisturb)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: doNotDisturb ? "var(--g-primary)" : "#ccc",
                cursor: "pointer", position: "relative", transition: "background .2s",
              }}
            >
              <div style={{
                position: "absolute",
                left: doNotDisturb ? 20 : 2, top: 2,
                width: 18, height: 18, borderRadius: 9,
                background: "#fff", transition: "left .2s",
              }} />
            </div>
          </label>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Guest 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="g-label">Клиент</label>
              <input
                className="g-input"
                placeholder="Фамилия Имя Отчество"
                value={`${lastName} ${firstName} ${patronymic}`.trim()}
                onChange={(e) => {
                  const parts = e.target.value.split(" ");
                  setLastName(parts[0] || "");
                  setFirstName(parts[1] || "");
                  setPatronymic(parts.slice(2).join(" "));
                }}
                required
              />
            </div>
            <div>
              <label className="g-label">Серия и номер паспорта</label>
              <input
                className="g-input"
                placeholder="Серия номер"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
              />
            </div>
            <div>
              <label className="g-label">Дата заселения</label>
              <input
                className="g-input"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Guest 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="g-label">Спутник</label>
              <input
                className="g-input"
                placeholder="Фамилия Имя Отчество"
                value={`${lastName2} ${firstName2} ${patronymic2}`.trim()}
                onChange={(e) => {
                  const parts = e.target.value.split(" ");
                  setLastName2(parts[0] || "");
                  setFirstName2(parts[1] || "");
                  setPatronymic2(parts.slice(2).join(" "));
                }}
              />
            </div>
            <div>
              <label className="g-label">Серия и номер паспорта</label>
              <input
                className="g-input"
                placeholder="Серия номер"
                value={passport2}
                onChange={(e) => setPassport2(e.target.value)}
              />
            </div>
            <div>
              <label className="g-label">Дата выезда</label>
              <input
                className="g-input"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Wishes */}
          <div>
            <label className="g-label">Пожелания</label>
            <textarea
              className="g-input"
              placeholder="Доставьте ведёрко со льдом"
              value={wishes}
              onChange={(e) => setWishes(e.target.value)}
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Services grid */}
          <div>
            <label className="g-label">Дополнительные услуги</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 8, marginTop: 8,
            }}>
              {services.map((s) => (
                <label
                  key={s}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, cursor: "pointer",
                    color: selectedServices.includes(s) ? "var(--g-primary)" : "var(--g-text)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s)}
                    onChange={() => toggleService(s)}
                    style={{ accentColor: "var(--g-primary)" }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="g-btn-primary"
            disabled={loading}
            style={{ letterSpacing: 1 }}
          >
            {loading ? "Регистрируем..." : "⊠ Регистрация"}
          </button>
        </div>
      </div>
    </form>
  );
}
