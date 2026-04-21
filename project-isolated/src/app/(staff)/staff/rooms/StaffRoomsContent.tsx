"use client";

import { useState } from "react";
import Link from "next/link";

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

interface BookingInfo {
  roomId: number | null;
  guestId: number | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  status: string;
  guestFirstName: string | null;
  guestLastName: string | null;
}

interface Room {
  id: number;
  number: string;
  type: string;
  floor: number;
  pricePerNight: string;
  capacity: number;
  amenities: string[] | null;
  isActive: boolean;
}

interface Props {
  rooms: Room[];
  bookingsByRoom: Record<number, BookingInfo>;
  freeOnly: boolean;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export default function StaffRoomsContent({ rooms, bookingsByRoom, freeOnly }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);

  const displayRooms = freeOnly
    ? rooms.filter((r) => !bookingsByRoom[r.id])
    : rooms;

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <>
      {/* Desktop table */}
      <div className="rooms-table" style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--g-border)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 60px",
          padding: "12px 20px",
          background: "#fafafa",
          borderBottom: "1px solid var(--g-border)",
          fontSize: 13, color: "var(--g-text-secondary)", fontWeight: 500,
        }}>
          <span>Номер</span>
          <span>Статус</span>
          <span>Даты бронирования</span>
          <span>Гость</span>
          <span />
        </div>

        {displayRooms.map((room, i) => {
          const booking = bookingsByRoom[room.id];
          const isBusy = !!booking;
          const guestName = booking
            ? `${booking.guestLastName ?? ""} ${booking.guestFirstName ?? ""}`.trim()
            : null;

          return (
            <div
              key={room.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 60px",
                padding: "14px 20px",
                borderBottom: i < displayRooms.length - 1 ? "1px solid var(--g-border-light)" : "none",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  background: isBusy ? "var(--g-status-busy)" : "var(--g-status-free)",
                  width: 8, height: 8, display: "inline-block", borderRadius: "50%", flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {ROOM_TYPE_LABELS[room.type] ?? room.type} №{room.number}
                </span>
              </div>

              <span style={{ fontSize: 13, fontWeight: 600, color: isBusy ? "var(--g-text)" : "var(--g-status-free)" }}>
                {isBusy ? "Занят" : "Свободен"}
              </span>

              <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>
                {booking ? `${formatDate(booking.checkInDate)} — ${formatDate(booking.checkOutDate)}` : "—"}
              </span>

              <span style={{ fontSize: 13, color: isBusy ? "var(--g-text)" : "var(--g-text-secondary)" }}>
                {guestName || `до ${room.capacity} чел.`}
              </span>

              <div>
                {!isBusy ? (
                  <Link
                    href={`/staff/checkin?roomId=${room.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 6,
                      background: "var(--g-primary)", color: "#fff",
                      textDecoration: "none", fontSize: 16, fontWeight: 700,
                    }}
                    title="Зарегистрировать гостя"
                  >
                    +
                  </Link>
                ) : (
                  <Link
                    href={`/staff/checkin/${booking?.guestId}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 6,
                      background: "var(--g-border)", color: "var(--g-text-secondary)",
                      textDecoration: "none", fontSize: 14,
                    }}
                    title="Карточка гостя"
                  >
                    ⋯
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {displayRooms.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--g-text-secondary)" }}>
            {freeOnly ? "Нет свободных номеров" : "Нет номеров в системе"}
          </div>
        )}
      </div>

      {/* Mobile accordion */}
      <div className="rooms-accordion" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {displayRooms.map((room) => {
          const booking = bookingsByRoom[room.id];
          const isBusy = !!booking;
          const isOpen = openId === room.id;
          const guestName = booking
            ? `${booking.guestLastName ?? ""} ${booking.guestFirstName ?? ""}`.trim()
            : null;

          return (
            <div
              key={room.id}
              style={{
                background: "#fff",
                borderBottom: "1px solid var(--g-border-light)",
              }}
            >
              {/* Row header — always visible */}
              <button
                onClick={() => toggle(room.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  padding: "14px 16px", background: "transparent", border: "none",
                  textAlign: "left", cursor: "pointer", gap: 10,
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: isBusy ? "var(--g-status-busy)" : "var(--g-status-free)",
                }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--g-text)" }}>
                  {ROOM_TYPE_LABELS[room.type] ?? room.type} №{room.number}
                </span>
                <span style={{ fontSize: 18, color: "var(--g-text-muted)", lineHeight: 1 }}>
                  {isOpen ? "∧" : "∨"}
                </span>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding: "0 16px 16px 34px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--g-text-muted)", marginBottom: 3 }}>Статус</div>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: isBusy ? "var(--g-text)" : "var(--g-status-free)",
                      }}>
                        {isBusy ? "Занят" : "Свободен"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--g-text-muted)", marginBottom: 3 }}>Даты бронирования</div>
                      <div style={{ fontSize: 14 }}>
                        {booking ? `${formatDate(booking.checkInDate)}/${formatDate(booking.checkOutDate)}` : "--.--.--"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: "var(--g-text-muted)", marginBottom: 3 }}>
                      {isBusy ? "Гость" : "Вместимость"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {Array.from({ length: room.capacity }).map((_, ci) => (
                        <span
                          key={ci}
                          style={{
                            width: 10, height: 10, borderRadius: "50%", display: "inline-block",
                            background: isBusy && ci < room.capacity ? "var(--g-status-free)" : "var(--g-border)",
                          }}
                        />
                      ))}
                      {isBusy && guestName && (
                        <span style={{ fontSize: 13, color: "var(--g-text)", marginLeft: 4 }}>{guestName}</span>
                      )}
                    </div>
                  </div>

                  {!isBusy ? (
                    <Link
                      href={`/staff/checkin?roomId=${room.id}`}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: "var(--g-primary)", color: "#fff",
                        borderRadius: 8, padding: "10px 20px",
                        textDecoration: "none", fontSize: 14, fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      + Зарегистрировать гостя
                    </Link>
                  ) : (
                    <Link
                      href={`/staff/checkin/${booking?.guestId}`}
                      style={{
                        display: "inline-flex", alignItems: "center",
                        color: "var(--g-primary)", fontSize: 13, fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Карточка гостя →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {displayRooms.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--g-text-secondary)" }}>
            {freeOnly ? "Нет свободных номеров" : "Нет номеров в системе"}
          </div>
        )}
      </div>
    </>
  );
}
