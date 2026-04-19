import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/auth/jwt";
import { db, tasks } from "@/db";
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

  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.scheduledTime), desc(tasks.createdAt));

  const ROOM_CHECKLIST = [
    "Статус номера",
    "Уборка проведена",
    "Постельное бельё",
    "Вода в номере",
    "TV работает",
    "Завтрак подан",
    "Заправлен чайник",
    "Завтрак подан",
  ];

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <StaffTasksClient
        initialTasks={allTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          scheduledTime: t.scheduledTime ? new Date(t.scheduledTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : null,
          notes: t.notes,
          roomId: t.roomId,
        }))}
        checklist={ROOM_CHECKLIST}
      />
    </StaffShell>
  );
}
