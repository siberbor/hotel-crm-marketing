import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/auth/jwt";
import { db, bookings, rooms, guests } from "@/db";
import { eq, desc } from "drizzle-orm";
import GuestLogoutButton from "./GuestLogoutButton";
import GuestBookingForm from "./GuestBookingForm";
import "@/styles/tokens-green.css";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:      { label: "Ожидает",       color: "#FF9800" },
  confirmed:    { label: "Подтверждено",  color: "#7CB342" },
  checked_in:   { label: "Заселён",       color: "#2196F3" },
  checked_out:  { label: "Выселен",       color: "#9E9E9E" },
  cancelled:    { label: "Отменено",      color: "#F44336" },
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function GuestBookingsPage() {
  // Auth guard
  const cookieStore = await cookies();
  const token = cookieStore.get("guest_token")?.value;
  if (!token) redirect("/guest/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope !== "guest" || !payload.guestId) redirect("/guest/login");

  // Fetch guest info
  const [guest] = await db.select().from(guests).where(eq(guests.id, payload.guestId)).limit(1);

  // Fetch bookings with room info
  const guestBookings = await db
    .select({
      id: bookings.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
      paidAmount: bookings.paidAmount,
      paymentStatus: bookings.paymentStatus,
      notes: bookings.notes,
      roomNumber: rooms.number,
      roomType: rooms.type,
      roomFloor: rooms.floor,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.guestId, payload.guestId))
    .orderBy(desc(bookings.checkInDate));

  const activeBooking = guestBookings.find(
    (b) => b.status === "confirmed" || b.status === "checked_in",
  );

  return (
    <div className="green-theme">
      {/* Header */}
      <header style={{
        background: "var(--g-header-bg)", color: "#fff",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--g-primary)", fontSize: 18 }}>MarkG</span>
          <span style={{ color: "#fff", fontSize: 18 }}>Hotel</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/guest/bookings" style={{ color: "#fff", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            Мои бронирования
          </Link>
          {activeBooking && (
            <Link href="/guest/services" style={{ color: "var(--g-primary-light)", fontSize: 14, textDecoration: "none" }}>
              Запросить услугу
            </Link>
          )}
          <GuestLogoutButton />
        </nav>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Здравствуйте, {guest?.firstName ?? "Гость"}!
          </h1>
          <p style={{ color: "var(--g-text-secondary)", fontSize: 15 }}>
            Ваши бронирования в MarkG Hotel
          </p>
        </div>

        {/* Active booking highlight */}
        {activeBooking && (
          <div style={{
            background: "var(--g-primary-bg)", border: "1.5px solid var(--g-primary)",
            borderRadius: 12, padding: 24, marginBottom: 32,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--g-primary-hover)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                Текущее бронирование
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                Номер {activeBooking.roomNumber}
              </div>
              <div style={{ color: "var(--g-text-secondary)", fontSize: 14, marginTop: 4 }}>
                {formatDate(activeBooking.checkInDate)} — {formatDate(activeBooking.checkOutDate)}
              </div>
            </div>
            <Link href="/guest/services" style={{
              background: "var(--g-primary)", color: "#fff",
              padding: "12px 24px", borderRadius: 8,
              fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}>
              Заказать услугу
            </Link>
          </div>
        )}

        {/* Booking form */}
        <div style={{ marginBottom: 32 }}>
          <GuestBookingForm />
        </div>

        {/* All bookings */}
        {guestBookings.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 12, padding: 48,
            textAlign: "center", border: "1px solid var(--g-border)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Нет бронирований</h2>
            <p style={{ color: "var(--g-text-secondary)", marginBottom: 24 }}>
              У вас пока нет бронирований в нашем отеле.
            </p>
            <Link href="/#rooms" style={{
              background: "var(--g-primary)", color: "#fff",
              padding: "12px 24px", borderRadius: 8,
              fontWeight: 600, textDecoration: "none",
            }}>
              Посмотреть номера
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--g-text-secondary)", marginBottom: 8 }}>
              Все бронирования ({guestBookings.length})
            </h2>
            {guestBookings.map((b) => {
              const st = STATUS_LABELS[b.status] ?? { label: b.status, color: "#9E9E9E" };
              const nights = b.checkInDate && b.checkOutDate
                ? Math.ceil((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000)
                : null;

              return (
                <div key={b.id} style={{
                  background: "#fff", borderRadius: 12,
                  border: "1px solid var(--g-border)",
                  padding: "20px 24px",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 16,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>Номер {b.roomNumber}</span>
                      <span style={{
                        background: `${st.color}1A`, color: st.color,
                        borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ color: "var(--g-text-secondary)", fontSize: 14 }}>
                      {formatDate(b.checkInDate)} — {formatDate(b.checkOutDate)}
                      {nights && <span style={{ marginLeft: 8 }}>({nights} ночей)</span>}
                    </div>
                    {b.notes && (
                      <div style={{ fontSize: 13, color: "var(--g-text-muted)", marginTop: 6, fontStyle: "italic" }}>
                        {b.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--g-primary)" }}>
                      {Number(b.totalPrice).toLocaleString("ru-RU")} ₽
                    </div>
                    <div style={{ fontSize: 12, color: b.paymentStatus === "paid" ? "#4CAF50" : "#9E9E9E", marginTop: 2 }}>
                      {b.paymentStatus === "paid" ? "Оплачено" : "Ожидает оплаты"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
