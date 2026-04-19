"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "@/styles/tokens-green.css";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Неверный логин или пароль");
        return;
      }
      router.push("/staff/rooms");
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="green-theme"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d3a1a 50%, #1a2a0a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--g-primary)" }}>MarkG</span>
        <span style={{ fontSize: 24, fontWeight: 300, color: "#fff" }}>CRM</span>
      </div>

      {/* Card — matches Авторизация.png */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4, color: "#212121" }}>
          Авторизация в системе
        </h1>
        <p style={{ fontSize: 13, color: "#9E9E9E", textAlign: "center", marginBottom: 28 }}>
          Добро пожаловать в MarkGCRM<br />Введите ваш логин и пароль
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="g-label">Логин</label>
            <input
              className="g-input"
              type="email"
              placeholder="Логин"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="g-label">Пароль</label>
            <input
              className="g-input"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#757575", cursor: "pointer" }}>
              <input type="checkbox" style={{ accentColor: "var(--g-primary)" }} />
              Запомнить меня
            </label>
            <span style={{ color: "#9E9E9E" }}>Забыли пароль?</span>
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              color: "#dc2626", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="g-btn-primary"
            disabled={loading}
            style={{ marginTop: 4, letterSpacing: 1 }}
          >
            {loading ? "Вход..." : "ВОЙТИ"}
          </button>
        </form>
      </div>

      <Link href="/" style={{ marginTop: 24, color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
        ← Сайт отеля
      </Link>
    </div>
  );
}
