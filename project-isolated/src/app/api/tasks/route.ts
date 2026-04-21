import { NextRequest, NextResponse } from "next/server";
import { db, tasks } from "@/db";
import { desc, asc } from "drizzle-orm";

function getUser(req: NextRequest) {
  const raw = req.headers.get("x-user");
  return raw ? JSON.parse(raw) : null;
}

export async function GET(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        scheduledTime: tasks.scheduledTime,
        notes: tasks.notes,
        roomId: tasks.roomId,
        assignedToId: tasks.assignedTo,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .orderBy(asc(tasks.scheduledTime), desc(tasks.createdAt));

    const filtered = result.filter((t) => {
      if (status && t.status !== status) return false;
      if (assignedTo && String(t.assignedToId) !== assignedTo) return false;
      return true;
    });

    return NextResponse.json({ data: filtered });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  try {
    const body = await request.json();
    const { title, assignedTo, roomId, scheduledTime, notes } = body as {
      title?: string;
      assignedTo?: number;
      roomId?: number;
      scheduledTime?: string;
      notes?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Название задачи обязательно" } },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        status: "todo",
        assignedTo: assignedTo ?? null,
        roomId: roomId ?? null,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        notes: notes ?? null,
        createdBy: user.userId,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
