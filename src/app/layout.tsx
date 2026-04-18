import "./globals.css";
import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Hotel CRM",
  description: "CRM система для отеля",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
