"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "@/styles/tokens-green.css";

export default function GuestLoginForm() {
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
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Ошибка входа");
        return;
      }
      router.push("/guest/bookings");
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
      <Link href="/" style={{ marginBottom: 32, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--g-primary)" }}>MarkG</span>
        <span style={{ fontSize: 24, fontWeight: 300, color: "#fff" }}>Hotel</span>
      </Link>

      {/* Card */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: "#212121" }}>
          Личный кабинет
        </h1>
        <p style={{ fontSize: 14, color: "#757575", textAlign: "center", marginBottom: 28 }}>
          Добро пожаловать. Введите ваш email и пароль.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="g-label">Логин</label>
            <input
              className="g-input"
              type="email"
              placeholder="email@example.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
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
            style={{ marginTop: 8 }}
          >
            {loading ? "Вход..." : "ВОЙТИ"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
        Нет аккаунта?{" "}
        <Link href="/guest/register" style={{ color: "var(--g-primary-light)", fontWeight: 600, textDecoration: "none" }}>
          Зарегистрироваться
        </Link>
      </p>

      <Link href="/" style={{ marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
        ← Вернуться на сайт отеля
      </Link>
    </div>
  );
}
