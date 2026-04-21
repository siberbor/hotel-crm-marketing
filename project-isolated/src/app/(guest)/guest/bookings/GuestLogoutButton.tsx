"use client";

import { useRouter } from "next/navigation";
import "@/styles/tokens-green.css";

export default function GuestLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/guest", { method: "DELETE" });
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.7)",
        padding: "6px 14px",
        borderRadius: 6,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      Выйти
    </button>
  );
}
