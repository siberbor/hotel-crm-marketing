"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function StaffRoomsToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freeOnly = searchParams?.get("freeOnly") === "1";

  const toggle = () => {
    router.push(freeOnly ? "/staff/rooms" : "/staff/rooms?freeOnly=1");
  };

  return (
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, color: "var(--g-text-secondary)" }}>
        Только свободные
      </span>
      <div
        onClick={toggle}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: freeOnly ? "var(--g-primary)" : "#ccc",
          cursor: "pointer", position: "relative", transition: "background .2s",
        }}
      >
        <div style={{
          position: "absolute",
          left: freeOnly ? 18 : 2, top: 2,
          width: 16, height: 16, borderRadius: 8,
          background: "#fff", transition: "left .2s",
        }} />
      </div>
    </div>
  );
}
