import "@/styles/tokens-green.css";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="green-theme"
      style={{
        minHeight: "100vh",
        background: "var(--g-bg)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
