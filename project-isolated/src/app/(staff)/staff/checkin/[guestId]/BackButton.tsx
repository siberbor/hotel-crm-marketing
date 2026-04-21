"use client";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "var(--g-primary)", color: "#fff",
        border: "none", borderRadius: 8,
        padding: "10px 24px",
        fontSize: 14, fontWeight: 600,
        cursor: "pointer", letterSpacing: 1,
      }}
    >
      ← Назад
    </button>
  );
}
