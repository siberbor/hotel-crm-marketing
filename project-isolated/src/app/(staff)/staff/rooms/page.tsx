import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { verifyToken } from "@/auth/jwt";
import { db, bookings, guests } from "@/db";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import * as roomService from "@/services/room.service";
import StaffShell from "@/components/staff/StaffShell";
import StaffRoomsToggle from "./StaffRoomsToggle";
import "@/styles/tokens-green.css";

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export default async function StaffRoomsPage({
  searchParams,
}: {
  searchParams: { freeOnly?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  const freeOnly = searchParams?.freeOnly === "1";
  const now = new Date();

  // All active rooms (has demoStore fallback)
  const allRooms = await roomService.getAllRooms();

  // Active bookings overlapping today
  let activeBookings: {
    roomId: number | null;
    guestId: number | null;
    checkInDate: Date | null;
    checkOutDate: Date | null;
    status: string;
    guestFirstName: string | null;
    guestLastName: string | null;
  }[] = [];

  try {
    activeBookings = await db
      .select({
        roomId: bookings.roomId,
        guestId: bookings.guestId,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        status: bookings.status,
        guestFirstName: guests.firstName,
        guestLastName: guests.lastName,
      })
      .from(bookings)
      .leftJoin(guests, eq(bookings.guestId, guests.id))
      .where(
        and(
          inArray(bookings.status, ["checked_in", "confirmed"]),
          lte(bookings.checkInDate, now),
          gte(bookings.checkOutDate, now),
        ),
      );
  } catch {
    // DB unavailable — show rooms without occupancy info
  }

  const bookingsByRoom = new Map(activeBookings.map((b) => [b.roomId, b]));

  const displayRooms = freeOnly
    ? allRooms.filter((r) => !bookingsByRoom.has(r.id))
    : allRooms;

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <div style={{ padding: "20px 16px" }}>
        {/* Filter bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 16, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 14, color: "var(--g-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
            ▼ Фильтр
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {["Все", "Номера"].map((f) => (
              <span
                key={f}
                style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 13,
                  background: f === "Номера" ? "var(--g-primary)" : "transparent",
                  color: f === "Номера" ? "#fff" : "var(--g-text-secondary)",
                  border: "1px solid var(--g-border)", cursor: "pointer",
                }}
              >
                {f}
              </span>
            ))}
          </div>
          <Suspense fallback={<div style={{ marginLeft: "auto" }} />}>
            <StaffRoomsToggle />
          </Suspense>
        </div>

        {/* Rooms table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--g-border)", overflow: "hidden" }}>
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
            const booking = bookingsByRoom.get(room.id);
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
                {/* Room name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    background: isBusy ? "var(--g-status-busy)" : "var(--g-status-free)",
                    width: 8, height: 8, display: "inline-block", borderRadius: "50%",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {ROOM_TYPE_LABELS[room.type] ?? room.type} №{room.number}
                  </span>
                </div>

                {/* Status */}
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: isBusy ? "var(--g-text)" : "var(--g-status-free)",
                }}>
                  {isBusy ? "Занят" : "Свободен"}
                </span>

                {/* Dates */}
                <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>
                  {booking
                    ? `${formatDate(booking.checkInDate)} — ${formatDate(booking.checkOutDate)}`
                    : "—"}
                </span>

                {/* Guest name / capacity */}
                <span style={{ fontSize: 13, color: isBusy ? "var(--g-text)" : "var(--g-text-secondary)" }}>
                  {guestName || `до ${room.capacity} чел.`}
                </span>

                {/* Action button */}
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

        {/* Summary */}
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--g-text-secondary)" }}>
          Всего: {allRooms.length} · Занято: {bookingsByRoom.size} · Свободно: {allRooms.length - bookingsByRoom.size}
        </div>
      </div>
    </StaffShell>
  );
}
