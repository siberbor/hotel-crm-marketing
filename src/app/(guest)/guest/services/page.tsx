import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/auth/jwt";
import { db, bookings, rooms } from "@/db";
import { eq } from "drizzle-orm";
import GuestServiceForm from "./GuestServiceForm";
import "@/styles/tokens-green.css";

export default async function GuestServicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("guest_token")?.value;
  if (!token) redirect("/guest/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope !== "guest" || !payload.guestId) redirect("/guest/login");

  const allBookings = await db
    .select({
      id: bookings.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      roomNumber: rooms.number,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.guestId, payload.guestId));

  const activeFiltered = allBookings.filter((b) =>
    ["confirmed", "checked_in"].includes(b.status),
  );

  const SERVICE_CATEGORIES = [
    "Доставка в номер",
    "Уборка номера",
    "Дополнительные подушки/одеяла",
    "Трансфер",
    "Экскурсия",
    "СПА-процедура",
    "Ресторан (бронь столика)",
    "Другое",
  ];

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
          <Link href="/guest/bookings" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>
            Мои бронирования
          </Link>
          <Link href="/guest/services" style={{ color: "#fff", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            Запросить услугу
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Запросить услугу</h1>
        <p style={{ color: "var(--g-text-secondary)", fontSize: 15, marginBottom: 32 }}>
          Наши сотрудники свяжутся с вами в течение 15 минут.
        </p>

        {activeFiltered.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 12, padding: 40,
            textAlign: "center", border: "1px solid var(--g-border)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏨</div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Нет активного бронирования</h2>
            <p style={{ color: "var(--g-text-secondary)", marginBottom: 20, fontSize: 14 }}>
              Запросить услугу можно только во время проживания.
            </p>
            <Link href="/guest/bookings" style={{
              background: "var(--g-primary)", color: "#fff",
              padding: "10px 20px", borderRadius: 8,
              fontWeight: 600, textDecoration: "none", fontSize: 14,
            }}>
              Мои бронирования
            </Link>
          </div>
        ) : (
          <GuestServiceForm
            bookings={activeFiltered.map((b) => ({
              id: b.id,
              roomNumber: b.roomNumber ?? "—",
              checkInDate: b.checkInDate
                ? new Date(b.checkInDate).toLocaleDateString("ru-RU")
                : "—",
              checkOutDate: b.checkOutDate
                ? new Date(b.checkOutDate).toLocaleDateString("ru-RU")
                : "—",
            }))}
            categories={SERVICE_CATEGORIES}
          />
        )}
      </div>
    </div>
  );
}
