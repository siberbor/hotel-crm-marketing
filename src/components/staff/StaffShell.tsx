"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "@/styles/tokens-green.css";

interface ShiftData {
  id: number;
  status: "working" | "break" | "done";
  startedAt: string;
}

interface Props {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  manager: "Управляющий",
  receptionist: "Портье",
  marketing: "Маркетинг",
};

const SHIFT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  working: { label: "На смене", color: "var(--g-status-free)" },
  break:   { label: "Перерыв",  color: "var(--g-status-busy)" },
  done:    { label: "Смена завершена", color: "var(--g-status-done)" },
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function StaffShell({ userName, userRole, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Load current shift
  useEffect(() => {
    fetch("/api/shifts?me=1")
      .then((r) => r.json())
      .then((d) => { if (d.data) setShift(d.data); })
      .catch(() => {});
  }, []);

  const startShift = async () => {
    setShiftLoading(true);
    try {
      const res = await fetch("/api/shifts", { method: "POST" });
      const d = await res.json();
      if (d.data) setShift(d.data);
    } finally {
      setShiftLoading(false);
    }
  };

  const updateShift = async (status: "working" | "break" | "done") => {
    if (!shift) return;
    setShiftLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (d.data) setShift(d.data);
    } finally {
      setShiftLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/staff/login");
  };

  const tabs = [
    { href: "/staff/rooms",     label: "Номера",      icon: "🔑" },
    { href: "/staff/tasks",     label: "Задачи",      icon: "☑" },
    { href: "/staff/employees", label: "Сотрудники",  icon: "👥" },
  ];

  const shiftStatus = shift ? SHIFT_STATUS_LABELS[shift.status] : null;

  return (
    <div className="green-theme" style={{ minHeight: "100vh", background: "var(--g-bg)", display: "flex", flexDirection: "column" }}>
      {/* Top header */}
      <header style={{
        background: "var(--g-header-bg)", color: "#fff",
        padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Left: user + shift status */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{userName}</span>
            <span style={{ fontSize: 12, color: "var(--g-header-sub)", marginLeft: 6 }}>
              {ROLE_LABELS[userRole] ?? userRole}
            </span>
          </div>

          {shift && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                className="g-status-dot"
                style={{
                  background: shiftStatus?.color,
                  width: 8, height: 8,
                  display: "inline-block", borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--g-header-sub)" }}>{shiftStatus?.label}</span>
            </div>
          )}

          {/* Выход из системы */}
          <button
            onClick={logout}
            style={{
              background: "transparent", border: "none",
              color: "var(--g-header-sub)", fontSize: 12, cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            Выход
          </button>
        </div>

        {/* Center: date + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--g-header-sub)" }}>
          <span>📅 {formatDate(now)}</span>
          <span>🕐 {formatTime(now)}</span>
        </div>

        {/* Right: shift controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!shift || shift.status === "done" ? (
            <button
              onClick={startShift}
              disabled={shiftLoading}
              style={{
                background: "var(--g-primary)", color: "#fff",
                border: "none", borderRadius: 6,
                padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              + Открыть смену
            </button>
          ) : (
            <>
              {shift.status === "working" && (
                <button
                  onClick={() => updateShift("break")}
                  disabled={shiftLoading}
                  style={{
                    background: "rgba(255,152,0,0.2)", color: "#FF9800",
                    border: "1px solid rgba(255,152,0,0.4)",
                    borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  Перерыв
                </button>
              )}
              {shift.status === "break" && (
                <button
                  onClick={() => updateShift("working")}
                  disabled={shiftLoading}
                  style={{
                    background: "rgba(124,179,66,0.2)", color: "var(--g-primary)",
                    border: "1px solid rgba(124,179,66,0.4)",
                    borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  Продолжить
                </button>
              )}
              <button
                onClick={() => updateShift("done")}
                disabled={shiftLoading}
                style={{
                  background: "rgba(244,67,54,0.15)", color: "#F44336",
                  border: "1px solid rgba(244,67,54,0.3)",
                  borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer",
                }}
              >
                × Завершить смену
              </button>
            </>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid var(--g-border)",
        display: "flex",
        position: "sticky", top: 52, zIndex: 90,
      }}>
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href) ?? false;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 24px",
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? "var(--g-primary)" : "var(--g-text-secondary)",
                textDecoration: "none",
                borderBottom: active ? "2px solid var(--g-primary)" : "2px solid transparent",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
