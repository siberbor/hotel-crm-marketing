"use client";

import { useState } from "react";
import "@/styles/tokens-green.css";

type TaskStatus = "todo" | "in_progress" | "urgent" | "done" | "postponed";

interface Task {
  id: number;
  title: string;
  status: string;
  scheduledTime: string | null;
  notes: string | null;
  roomId: number | null;
}

interface RoomOption {
  id: number;
  number: string;
  type: string;
}

interface UserOption {
  id: number;
  name: string | null;
  email: string;
}

interface Props {
  initialTasks: Task[];
  checklist: string[];
  rooms: RoomOption[];
  staffUsers: UserOption[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  todo:        { label: "Не начата",   color: "var(--g-text-muted)" },
  in_progress: { label: "В работе",   color: "#2196F3" },
  urgent:      { label: "Срочно",     color: "var(--g-status-urgent)" },
  done:        { label: "Выполнено",  color: "var(--g-status-free)" },
  postponed:   { label: "Отложено",   color: "var(--g-status-done)" },
};

const STATUS_CYCLE: TaskStatus[] = ["todo", "in_progress", "urgent", "done", "postponed"];

export default function StaffTasksClient({ initialTasks, checklist, rooms, staffUsers }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | "urgent" | "postponed" | "done">("all");
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false));
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: "",
    isUrgent: false,
    roomId: "",
    assignedTo: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "urgent") return t.status === "urgent";
    if (filter === "postponed") return t.status === "postponed";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const cycleStatus = async (task: Task) => {
    const idx = STATUS_CYCLE.indexOf(task.status as TaskStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const createTask = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    setCreateError("");

    const today = new Date().toISOString().split("T")[0];
    const scheduledTime = form.startTime ? `${today}T${form.startTime}:00` : undefined;
    const notesText = [
      form.endTime ? `Время завершения: ${form.endTime}` : "",
      form.notes.trim(),
    ].filter(Boolean).join("\n") || undefined;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          roomId: form.roomId ? Number(form.roomId) : undefined,
          assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
          scheduledTime,
          notes: notesText,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setCreateError(d.error?.message || "Ошибка создания");
        return;
      }
      if (d.data) {
        setTasks((prev) => [
          {
            id: d.data.id,
            title: d.data.title,
            status: form.isUrgent ? "urgent" : d.data.status,
            scheduledTime: form.startTime || null,
            notes: notesText ?? null,
            roomId: form.roomId ? Number(form.roomId) : null,
          },
          ...prev,
        ]);

        // Set urgent status if toggled
        if (form.isUrgent) {
          await fetch(`/api/tasks/${d.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "urgent" }),
          });
        }

        setForm({ title: "", isUrgent: false, roomId: "", assignedTo: "", startTime: "", endTime: "", notes: "" });
        setShowCreate(false);
      }
    } catch {
      setCreateError("Ошибка соединения");
    } finally {
      setCreating(false);
    }
  };

  const toggleCheck = (i: number) => {
    setChecks((prev) => prev.map((c, idx) => idx === i ? !c : c));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #E0E0E0", fontSize: 14,
    background: "#fff", boxSizing: "border-box",
    fontFamily: "inherit", color: "var(--g-text)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#616161", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden", position: "relative" }}>
      {/* Tasks list — left panel */}
      <div style={{ flex: 1, borderRight: "1px solid var(--g-border)", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Filter tabs */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          borderBottom: "1px solid var(--g-border)",
          padding: "0 16px",
        }}>
          {[
            { key: "all", label: "Все" },
            { key: "urgent", label: "Срочно" },
            { key: "postponed", label: "Отложено" },
            { key: "done", label: "Выполнено" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              style={{
                padding: "12px 14px", background: "transparent", border: "none",
                borderBottom: filter === f.key ? "2px solid var(--g-primary)" : "2px solid transparent",
                color: filter === f.key ? "var(--g-primary)" : "var(--g-text-secondary)",
                fontSize: 13, fontWeight: filter === f.key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--g-primary)", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "6px 12px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", margin: "8px 0 8px auto",
            }}
          >
            + Создать задачу
          </button>
        </div>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "3fr 1.5fr 1fr 80px",
          padding: "10px 16px",
          background: "#fafafa", borderBottom: "1px solid var(--g-border)",
          fontSize: 12, color: "var(--g-text-muted)", fontWeight: 500,
        }}>
          <span>Задача</span>
          <span>Статус</span>
          <span>Номер</span>
          <span>Время</span>
        </div>

        {/* Tasks */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {filteredTasks.map((task) => {
            const st = STATUS_LABELS[task.status] ?? STATUS_LABELS.todo;
            return (
              <div
                key={task.id}
                style={{
                  display: "grid", gridTemplateColumns: "3fr 1.5fr 1fr 80px",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--g-border-light)",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: task.status === "urgent" ? "var(--g-status-urgent)" :
                                task.status === "done" ? "var(--g-status-free)" :
                                "var(--g-status-busy)",
                  }} />
                  <span style={{ fontSize: 14 }}>{task.title}</span>
                </div>

                <button
                  onClick={() => cycleStatus(task)}
                  style={{
                    background: "transparent", border: "none",
                    display: "flex", alignItems: "center", gap: 4,
                    color: st.color, fontSize: 13, cursor: "pointer",
                    textAlign: "left", padding: 0,
                  }}
                >
                  ▾ {st.label}
                </button>

                <span style={{ fontSize: 12, color: "var(--g-text-secondary)" }}>
                  {task.roomId ? `№${task.roomId}` : "—"}
                </span>

                <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>
                  {task.scheduledTime ?? "—"}
                </span>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--g-text-secondary)", fontSize: 14 }}>
              Нет задач
            </div>
          )}
        </div>
      </div>

      {/* Checklist — right panel */}
      <div style={{ width: 240, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid var(--g-border)",
          fontSize: 13, fontWeight: 600, color: "var(--g-text)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ☑ Чек-лист уборки
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {checklist.map((item, i) => (
            <label
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", cursor: "pointer", fontSize: 13,
                color: checks[i] ? "var(--g-text-muted)" : "var(--g-text)",
                textDecoration: checks[i] ? "line-through" : "none",
                borderBottom: "1px solid var(--g-border-light)",
              }}
            >
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={() => toggleCheck(i)}
                style={{ accentColor: "var(--g-primary)", width: 16, height: 16 }}
              />
              {item}
            </label>
          ))}
        </div>

        {checks.some(Boolean) && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--g-border)" }}>
            <button
              onClick={() => setChecks(checklist.map(() => false))}
              style={{
                width: "100%", padding: "8px", borderRadius: 6,
                background: "rgba(244,67,54,0.1)", color: "#F44336",
                border: "1px solid rgba(244,67,54,0.2)", cursor: "pointer",
                fontSize: 13, fontWeight: 500,
              }}
            >
              ✕ Сбросить
            </button>
          </div>
        )}
      </div>

      {/* Create task modal overlay */}
      {showCreate && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div style={{
            background: "#fff", borderRadius: 12,
            width: "100%", maxWidth: 480,
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{
              background: "#424242", color: "#fff",
              padding: "14px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: 0 }}
              >
                ←
              </button>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Создание задачи</span>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title + urgent toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Новая задача</span>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  Срочно
                  <div
                    onClick={() => setForm((f) => ({ ...f, isUrgent: !f.isUrgent }))}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: form.isUrgent ? "var(--g-status-urgent)" : "#ccc",
                      cursor: "pointer", position: "relative", transition: "background .2s",
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      left: form.isUrgent ? 20 : 2, top: 2,
                      width: 18, height: 18, borderRadius: 9,
                      background: "#fff", transition: "left .2s",
                    }} />
                  </div>
                </label>
              </div>

              {/* Task title */}
              <div>
                <label style={labelStyle}>Задача</label>
                <input
                  style={inputStyle}
                  placeholder="Опишите задачу..."
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && createTask()}
                  autoFocus
                />
              </div>

              {/* Room */}
              <div>
                <label style={labelStyle}>Номер</label>
                <select
                  style={inputStyle}
                  value={form.roomId}
                  onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                >
                  <option value="">Выберите номер</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {ROOM_TYPE_LABELS[r.type] ?? r.type} №{r.number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label style={labelStyle}>Ответственный</label>
                <select
                  style={inputStyle}
                  value={form.assignedTo}
                  onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                >
                  <option value="">Не назначено</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email.split("@")[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Время начала</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="time"
                      style={inputStyle}
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Время завершения</label>
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label style={labelStyle}>Комментарий</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical" }}
                  rows={3}
                  placeholder="Дополнительная информация..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {createError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13,
                }}>
                  {createError}
                </div>
              )}

              <button
                onClick={createTask}
                disabled={creating || !form.title.trim()}
                style={{
                  background: creating || !form.title.trim() ? "#ccc" : "var(--g-primary)",
                  color: "#fff", border: "none", borderRadius: 8,
                  padding: "13px", fontSize: 15, fontWeight: 700,
                  cursor: creating || !form.title.trim() ? "not-allowed" : "pointer",
                  letterSpacing: 0.5,
                }}
              >
                {creating ? "Создаём..." : "✓ Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
