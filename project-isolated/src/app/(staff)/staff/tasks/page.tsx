import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/auth/jwt";
import { db, tasks, rooms, users } from "@/db";
import { asc, desc } from "drizzle-orm";
import StaffShell from "@/components/staff/StaffShell";
import StaffTasksClient from "./StaffTasksClient";
import "@/styles/tokens-green.css";

export default async function StaffTasksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  let allTasks: {
    id: number;
    title: string;
    status: string;
    scheduledTime: string | null;
    notes: string | null;
    roomId: number | null;
  }[] = [];

  let allRooms: { id: number; number: string; type: string }[] = [];
  let allUsers: { id: number; name: string | null; email: string }[] = [];

  try {
    const rawTasks = await db
      .select()
      .from(tasks)
      .orderBy(asc(tasks.scheduledTime), desc(tasks.createdAt));

    allTasks = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      scheduledTime: t.scheduledTime
        ? new Date(t.scheduledTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
        : null,
      notes: t.notes,
      roomId: t.roomId,
    }));
  } catch {
    // DB unavailable
  }

  try {
    allRooms = await db.select({ id: rooms.id, number: rooms.number, type: rooms.type }).from(rooms);
  } catch {
    // DB unavailable
  }

  try {
    allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  } catch {
    // DB unavailable
  }

  const ROOM_CHECKLIST = [
    "Статус номера",
    "Уборка проведена",
    "Постельное бельё",
    "Вода в номере",
    "TV работает",
    "Завтрак подан",
    "Заправлен чайник",
    "Полотенца заменены",
  ];

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <StaffTasksClient
        initialTasks={allTasks}
        checklist={ROOM_CHECKLIST}
        rooms={allRooms}
        staffUsers={allUsers}
      />
    </StaffShell>
  );
}
