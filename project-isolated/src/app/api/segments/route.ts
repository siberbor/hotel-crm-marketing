import { NextResponse } from "next/server";
import * as segmentService from "@/services/segment.service";

export async function GET() {
  try {
    const segments = await segmentService.getAllSegments();
    return NextResponse.json({ data: segments });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка получения сегментов",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, criteria } = body;

    if (!name) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "Название обязательно" },
        },
        { status: 400 },
      );
    }

    const segment = await segmentService.createSegment(
      name,
      type || "manual",
      criteria || null,
    );
    return NextResponse.json({ data: segment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка создания сегмента" },
      },
      { status: 500 },
    );
  }
}
