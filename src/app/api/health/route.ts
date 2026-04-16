import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    services: {
      database: "ok",
      api: "ok",
    },
  };

  return NextResponse.json({ data: health });
}
