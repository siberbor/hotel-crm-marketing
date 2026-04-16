import { NextResponse } from "next/server";
import * as roomService from "@/services/room.service";

export async function GET() {
  try {
    const rooms = await roomService.getAllRooms();
    return NextResponse.json({ data: rooms });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка получения номеров" },
      },
      { status: 500 },
    );
  }
}
