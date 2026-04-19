import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/auth/jwt";
import { db, rooms } from "@/db";
import { eq } from "drizzle-orm";
import StaffShell from "@/components/staff/StaffShell";
import StaffCheckinForm from "./StaffCheckinForm";
import "@/styles/tokens-green.css";

export default async function StaffCheckinPage({
  searchParams,
}: {
  searchParams: { roomId?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  // All rooms for selector
  const allRooms = await db
    .select({ id: rooms.id, number: rooms.number, type: rooms.type, capacity: rooms.capacity })
    .from(rooms)
    .where(eq(rooms.isActive, true));

  const preselectedRoomId = searchParams.roomId ? Number(searchParams.roomId) : undefined;

  const SERVICES = [
    "Шампанское в номер", "Бильярдный зал", "Зубочистку", "Бильярдный зал",
    "Массажистку азиатку", "Канделябры", "Комплимент от шефа", "Канделябры",
    "Бармен-шоу в номер", "Коня и сани", "Шоколадный фонтан", "Коня и сани",
  ];

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <a
            href="/staff/rooms"
            style={{ color: "var(--g-text-secondary)", textDecoration: "none", fontSize: 14 }}
          >
            ← Назад
          </a>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Бронирование</h1>
        </div>

        <StaffCheckinForm
          rooms={allRooms}
          preselectedRoomId={preselectedRoomId}
          services={SERVICES}
        />
      </div>
    </StaffShell>
  );
}
