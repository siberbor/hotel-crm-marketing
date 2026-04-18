import { NextResponse } from "next/server";
import * as syncService from "@/services/sync.service";
import { getSyncQueue } from "@/lib/queues";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const channel = searchParams.get("channel");

  try {
    const result = await syncService.getAllSyncLogs(page, limit);

    if (channel) {
      result.data = result.data.filter((log: { channel: string }) => log.channel === channel);
      result.total = result.data.length;
    }

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка получения логов" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = "full_sync" } = body as { type?: "full_sync" | "push_rates" | "fetch_bookings" };

    if (process.env.REDIS_URL) {
      const queue = getSyncQueue();
      const job = await queue.add(type, { type });
      return NextResponse.json({ data: { queued: true, jobId: job.id, type } });
    }

    // Fallback: direct sync when Redis unavailable
    const { channelManagerService } = await import("@/integrations/channel-manager");
    const result = await channelManagerService.fetchBookings();
    return NextResponse.json({ data: { queued: false, ...result } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка синхронизации" } },
      { status: 500 },
    );
  }
}
