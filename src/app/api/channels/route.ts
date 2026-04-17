import { NextResponse } from "next/server";
import * as syncService from "@/services/sync.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const channel = searchParams.get("channel");

  try {
    const result = await syncService.getAllSyncLogs(page, limit);

    if (channel) {
      result.data = result.data.filter((log: any) => log.channel === channel);
      result.total = result.data.length;
    }

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка получения логов" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel } = body;

    if (!channel) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Канал обязателен" } },
        { status: 400 },
      );
    }

    const result = await syncService.syncWithChannel(channel);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка синхронизации" } },
      { status: 500 },
    );
  }
}
