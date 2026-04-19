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

interface Props {
  initialTasks: Task[];
  checklist: string[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  todo:        { label: "Не выбрано",  color: "var(--g-text-muted)" },
  in_progress: { label: "В работе",    color: "#2196F3" },
  urgent:      { label: "Срочно",      color: "var(--g-status-urgent)" },
  done:        { label: "Выполнено",   color: "var(--g-status-free)" },
  postponed:   { label: "Отложено",    color: "var(--g-status-done)" },
};

const STATUS_CYCLE: TaskStatus[] = ["todo", "in_progress", "urgent", "done", "postponed"];

export default function StaffTasksClient({ initialTasks, checklist }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | "urgent" | "postponed" | "done">("all");
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false));
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

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
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const d = await res.json();
      if (d.data) {
        setTasks((prev) => [
          { id: d.data.id, title: d.data.title, status: d.data.status, scheduledTime: null, notes: null, roomId: null },
          ...prev,
        ]);
        setNewTitle("");
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleCheck = (i: number) => {
    setChecks((prev) => prev.map((c, idx) => idx === i ? !c : c));
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)", overflow: "hidden" }}>
      {/* Tasks list — left panel */}
      <div style={{ flex: 1, borderRight: "1px solid var(--g-border)", display: "flex", flexDirection: "column" }}>
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
                cursor: "pointer", transition: "all .15s",
              }}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--g-primary)", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "6px 12px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", margin: "8px 0 8px auto",
            }}
          >
            + Создать задачу
          </button>

          <button
            style={{
              background: "transparent", border: "1px solid var(--g-border)",
              borderRadius: 6, padding: "6px 10px",
              fontSize: 16, cursor: "pointer", marginLeft: 8,
              color: "var(--g-text-secondary)",
            }}
          >
            ☰
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{
            padding: "12px 16px", background: "var(--g-primary-bg)",
            borderBottom: "1px solid var(--g-border)",
            display: "flex", gap: 8,
          }}>
            <input
              className="g-input"
              placeholder="Название задачи..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask()}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              onClick={createTask}
              disabled={creating || !newTitle.trim()}
              className="g-btn-primary"
              style={{ width: "auto", padding: "8px 16px" }}
            >
              {creating ? "..." : "Добавить"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              style={{ background: "transparent", border: "1px solid var(--g-border)", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "3fr 1.5fr 1fr 80px",
          padding: "10px 16px",
          background: "#fafafa", borderBottom: "1px solid var(--g-border)",
          fontSize: 12, color: "var(--g-text-muted)", fontWeight: 500,
        }}>
          <span>Задача</span>
          <span>Статус</span>
          <span>Дополнительно</span>
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
                  transition: "background .1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: task.status === "urgent" ? "var(--g-status-urgent)" :
                                  task.status === "done" ? "var(--g-status-free)" :
                                  "var(--g-status-busy)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 14 }}>{task.title}</span>
                </div>

                <button
                  onClick={() => cycleStatus(task)}
                  style={{
                    background: "transparent", border: "none",
                    display: "flex", alignItems: "center", gap: 6,
                    color: st.color, fontSize: 13, cursor: "pointer",
                    textAlign: "left", padding: 0,
                  }}
                >
                  ▾ {st.label}
                </button>

                <button style={{
                  background: "transparent", border: "none",
                  color: "var(--g-text-muted)", cursor: "pointer",
                  fontSize: 16,
                }}>
                  ⓘ
                </button>

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
          ☑ Чек-лист
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {checklist.map((item, i) => (
            <label
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", cursor: "pointer",
                fontSize: 13,
                color: checks[i] ? "var(--g-text-muted)" : "var(--g-text)",
                textDecoration: checks[i] ? "line-through" : "none",
                borderBottom: "1px solid var(--g-border-light)",
                transition: "all .15s",
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
    </div>
  );
}
