"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "@/styles/tokens-green.css";

export default function GuestRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Ошибка регистрации");
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
      <Link href="/" style={{ marginBottom: 32, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--g-primary)" }}>MarkG</span>
        <span style={{ fontSize: 24, fontWeight: 300, color: "#fff" }}>Hotel</span>
      </Link>

      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: "#212121" }}>
          Создать аккаунт
        </h1>
        <p style={{ fontSize: 14, color: "#757575", textAlign: "center", marginBottom: 28 }}>
          Зарегистрируйтесь для доступа к личному кабинету
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="g-label">Имя</label>
              <input
                className="g-input"
                placeholder="Иван"
                value={form.firstName}
                onChange={set("firstName")}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="g-label">Фамилия</label>
              <input
                className="g-input"
                placeholder="Иванов"
                value={form.lastName}
                onChange={set("lastName")}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="g-label">Email</label>
            <input
              className="g-input"
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="g-label">Телефон (необязательно)</label>
            <input
              className="g-input"
              type="tel"
              placeholder="+7 900 000-00-00"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="g-label">Пароль</label>
            <input
              className="g-input"
              type="password"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={set("password")}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div>
            <label className="g-label">Повторите пароль</label>
            <input
              className="g-input"
              type="password"
              placeholder="Повторите пароль"
              value={form.passwordConfirm}
              onChange={set("passwordConfirm")}
              required
              autoComplete="new-password"
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
            style={{ marginTop: 4 }}
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#757575" }}>
          Уже есть аккаунт?{" "}
          <Link href="/guest/login" style={{ color: "var(--g-primary)", fontWeight: 600, textDecoration: "none" }}>
            Войти
          </Link>
        </p>
      </div>

      <Link href="/" style={{ marginTop: 24, color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none" }}>
        ← Вернуться на сайт отеля
      </Link>
    </div>
  );
}
