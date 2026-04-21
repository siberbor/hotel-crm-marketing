import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

async function checkDb(): Promise<"ok" | "error"> {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000)
      ),
    ]);
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<"ok" | "error"> {
  try {
    const result = await Promise.race([
      getRedis().ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000)
      ),
    ]);
    return result === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([checkDb(), checkRedis()]);

  const allOk = database === "ok" && redis === "ok";

  const health = {
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    services: { database, redis },
  };

  return NextResponse.json({ data: health }, { status: allOk ? 200 : 503 });
}
