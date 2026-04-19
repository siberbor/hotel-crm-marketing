import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/auth/jwt";
import { db, rooms, bookings, guests } from "@/db";
import { eq, and, lte, gte, inArray } from "drizzle-orm";
import StaffShell from "@/components/staff/StaffShell";
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

export default async function StaffRoomsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  const now = new Date();

  // All rooms
  const allRooms = await db.select().from(rooms).where(eq(rooms.isActive, true));

  // Active bookings (checked_in or confirmed overlapping today)
  const activeBookings = await db
    .select({
      roomId: bookings.roomId,
      guestId: bookings.guestId,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      guestName: guests.firstName,
      guestLastName: guests.lastName,
      guestCount: bookings.notes, // reuse notes for guest count display
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

  const bookingsByRoom = new Map(activeBookings.map((b) => [b.roomId, b]));

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
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>Показать занятые</span>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: "var(--g-toggle-on)", cursor: "pointer",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", right: 2, top: 2,
                width: 16, height: 16, borderRadius: 8,
                background: "#fff",
              }} />
            </div>
          </div>
        </div>

        {/* Rooms table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--g-border)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1.5fr 1fr 60px",
            padding: "12px 20px",
            background: "#fafafa",
            borderBottom: "1px solid var(--g-border)",
            fontSize: 13, color: "var(--g-text-secondary)", fontWeight: 500,
          }}>
            <span>Номер</span>
            <span>Статус</span>
            <span>Даты бронирования</span>
            <span>Количество гостей</span>
            <span />
          </div>

          {allRooms.map((room, i) => {
            const booking = bookingsByRoom.get(room.id);
            const isBusy = !!booking;

            return (
              <div
                key={room.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.5fr 1fr 60px",
                  padding: "14px 20px",
                  borderBottom: i < allRooms.length - 1 ? "1px solid var(--g-border-light)" : "none",
                  alignItems: "center",
                  transition: "background .15s",
                }}
              >
                {/* Room name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="g-status-dot"
                    style={{
                      background: isBusy ? "var(--g-status-busy)" : "var(--g-status-free)",
                      width: 8, height: 8, display: "inline-block", borderRadius: "50%",
                    }}
                  />
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
                    ? `${formatDate(booking.checkInDate)}/${formatDate(booking.checkOutDate)}`
                    : "--.--.--"}
                </span>

                {/* Guest count (capacity dots) */}
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: room.capacity }).map((_, ci) => (
                    <span
                      key={ci}
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: ci === 0 && isBusy ? "var(--g-status-busy)" :
                                    ci === 1 && isBusy && room.capacity > 1 ? "var(--g-status-busy)" :
                                    "var(--g-border)",
                        display: "inline-block",
                      }}
                    />
                  ))}
                  <button
                    style={{
                      marginLeft: 4, background: "transparent",
                      border: "1.5px solid var(--g-border)",
                      borderRadius: "50%", width: 20, height: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontSize: 12, color: "var(--g-text-secondary)",
                    }}
                  >
                    ⊕
                  </button>
                </div>

                {/* Check-in button */}
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
                    >
                      ⋯
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {allRooms.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--g-text-secondary)" }}>
              Нет номеров в системе
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}
