import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/auth/jwt";
import { db, users, shifts } from "@/db";
import { isNull } from "drizzle-orm";
import StaffShell from "@/components/staff/StaffShell";
import "@/styles/tokens-green.css";

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  manager: "Управляющий",
  receptionist: "Портье",
  marketing: "Маркетинг",
};

export default async function StaffEmployeesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/staff/login");

  const payload = await verifyToken(token);
  if (!payload || payload.scope === "guest") redirect("/staff/login");

  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  }).from(users);

  // Active shifts
  const activeShifts = await db
    .select({ userId: shifts.userId, status: shifts.status, startedAt: shifts.startedAt })
    .from(shifts)
    .where(isNull(shifts.endedAt));

  const shiftByUser = new Map(activeShifts.map((s) => [s.userId, s]));

  const SHIFT_STATUS: Record<string, { label: string; color: string }> = {
    working: { label: "На смене",  color: "var(--g-status-free)" },
    break:   { label: "Перерыв",   color: "var(--g-status-busy)" },
  };

  return (
    <StaffShell userName={payload.email.split("@")[0]} userRole={payload.role}>
      <div style={{ padding: "20px 16px" }}>
        {/* Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "var(--g-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>▼ Фильтр</span>
          {["Все", "На смене"].map((f, i) => (
            <span key={f} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 13,
              background: i === 0 ? "var(--g-primary)" : "transparent",
              color: i === 0 ? "#fff" : "var(--g-text-secondary)",
              border: "1px solid var(--g-border)", cursor: "pointer",
            }}>
              {f}
            </span>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--g-text-secondary)" }}>
            ↕ Сначала свободные
          </span>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--g-border)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 60px",
            padding: "12px 20px",
            background: "#fafafa", borderBottom: "1px solid var(--g-border)",
            fontSize: 13, color: "var(--g-text-muted)", fontWeight: 500,
          }}>
            <span>Сотрудник</span>
            <span>Должность</span>
            <span>Статус</span>
            <span>Дополнительно</span>
            <span>Задача</span>
          </div>

          {allUsers.map((u, i) => {
            const shift = shiftByUser.get(u.id);
            const isOnShift = !!shift;
            const shiftSt = shift ? SHIFT_STATUS[shift.status] : null;

            return (
              <div
                key={u.id}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 60px",
                  padding: "14px 20px",
                  borderBottom: i < allUsers.length - 1 ? "1px solid var(--g-border-light)" : "none",
                  alignItems: "center",
                }}
              >
                {/* Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: isOnShift
                        ? (shift?.status === "break" ? "var(--g-status-busy)" : "var(--g-status-free)")
                        : "var(--g-border)",
                    }}
                  />
                  <span style={{ fontSize: 14 }}>{u.name || u.email.split("@")[0]}</span>
                </div>

                {/* Role */}
                <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>

                {/* Shift status */}
                <div>
                  {shiftSt ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, color: shiftSt.color,
                    }}>
                      ▾ {shiftSt.label}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--g-text-muted)" }}>Не на смене</span>
                  )}
                </div>

                {/* Info */}
                <button style={{
                  background: "transparent", border: "none",
                  color: "var(--g-text-muted)", cursor: "pointer", fontSize: 16,
                }}>
                  ⓘ
                </button>

                {/* Assign task */}
                <button style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 6,
                  background: isOnShift ? "var(--g-primary)" : "var(--g-border)",
                  color: isOnShift ? "#fff" : "var(--g-text-muted)",
                  border: "none", cursor: isOnShift ? "pointer" : "default",
                  fontSize: 16, fontWeight: 700,
                }}>
                  +
                </button>
              </div>
            );
          })}

          {allUsers.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--g-text-secondary)" }}>
              Нет сотрудников
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}
