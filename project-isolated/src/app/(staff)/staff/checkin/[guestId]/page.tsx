import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/auth/jwt";
import { db, guests, bookings, rooms } from "@/db";
import { eq, desc } from "drizzle-orm";
import StaffShell from "@/components/staff/StaffShell";
import BackButton from "./BackButton";
import "@/styles/tokens-green.css";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function GuestCardPage({
  params,
}: {
  params: { guestId: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  const guestId = Number(params.guestId);
  if (isNaN(guestId)) redirect("/staff/rooms");

  const [guest] = await db.select().from(guests).where(eq(guests.id, guestId)).limit(1);
  if (!guest) redirect("/staff/rooms");

  const guestBookings = await db
    .select({
      id: bookings.id,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      notes: bookings.notes,
      roomNumber: rooms.number,
      roomType: rooms.type,
    })
    .from(bookings)
    .leftJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.guestId, guestId))
    .orderBy(desc(bookings.checkInDate));

  const activeBooking = guestBookings.find(
    (b) => b.status === "confirmed" || b.status === "checked_in",
  );

  // Parse notes for services/companion info
  const notes = guest.notes ?? "";
  const servicesMatch = notes.match(/Доп\. услуги: ([^\n]+)/);
  const services = servicesMatch ? servicesMatch[1].split(", ") : [];
  const companionMatch = notes.match(/Спутник: ([^\n]+)/);
  const companion = companionMatch ? companionMatch[1] : null;
  const passportMatch = notes.match(/Паспорт: ([^\n]+)/);
  const passport = passportMatch ? passportMatch[1] : null;
  const wishesMatch = notes.match(/Пожелания: ([^\n]+)/);
  const wishes = wishesMatch ? wishesMatch[1] : null;

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        {/* Modal-style card (like Анкета поселенца.png) */}
        <div style={{
          background: "#fff", borderRadius: 12,
          border: "1px solid var(--g-border)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: "#333", color: "#fff",
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Карточка гостя</h2>
            <Link
              href="/staff/rooms"
              style={{ color: "#fff", textDecoration: "none", fontSize: 20, lineHeight: 1 }}
            >
              ×
            </Link>
          </div>

          <div style={{ padding: 28 }}>
            {/* Room */}
            {activeBooking && (
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--g-text)" }}>
                {activeBooking.roomType ? `Джуниор сюит №${activeBooking.roomNumber}` : `Номер ${activeBooking.roomNumber}`}
              </h3>
            )}

            {/* Guest 1 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>🪪</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  {guest.lastName} {guest.firstName}
                </span>
              </div>
              {passport && (
                <div>
                  <span style={{ fontSize: 12, color: "var(--g-text-muted)" }}>Серия и номер паспорта:</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{passport}</div>
                </div>
              )}
            </div>

            {/* Companion */}
            {companion && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>🪪</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{companion.split(",")[0]}</span>
                </div>
                {companion.includes("паспорт:") && (
                  <div>
                    <span style={{ fontSize: 12, color: "var(--g-text-muted)" }}>Серия и номер паспорта:</span>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{companion.split("паспорт:")[1]?.trim()}</div>
                  </div>
                )}
              </div>
            )}

            {/* Dates */}
            {activeBooking && (
              <div style={{ display: "flex", gap: 32, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--g-text-muted)", marginBottom: 2 }}>Дата заселения:</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(activeBooking.checkInDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--g-text-muted)", marginBottom: 2 }}>Дата выезда:</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(activeBooking.checkOutDate)}</div>
                </div>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--g-text-muted)", marginBottom: 8 }}>Дополнительные услуги</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {services.map((s) => (
                    <span key={s} style={{
                      background: "var(--g-primary-bg)", color: "var(--g-primary-hover)",
                      borderRadius: 20, padding: "3px 12px", fontSize: 13,
                    }}>
                      • {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Wishes */}
            {(wishes || activeBooking?.notes) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "var(--g-text-muted)", marginBottom: 4 }}>Пожелания</div>
                <div style={{ fontSize: 14, fontStyle: "italic" }}>
                  {wishes || activeBooking?.notes}
                </div>
              </div>
            )}

            {/* Back button */}
            <BackButton />
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
