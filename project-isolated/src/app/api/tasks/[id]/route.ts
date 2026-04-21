import { NextRequest, NextResponse } from "next/server";
import { db, tasks } from "@/db";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["todo", "in_progress", "urgent", "done", "postponed"] as const;

function getUser(req: NextRequest) {
  const raw = req.headers.get("x-user");
  return raw ? JSON.parse(raw) : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: { code: "INVALID_ID" } }, { status: 400 });

  try {
    const body = await request.json();
    const { title, status, assignedTo, roomId, scheduledTime, notes } = body as {
      title?: string;
      status?: string;
      assignedTo?: number | null;
      roomId?: number | null;
      scheduledTime?: string | null;
      notes?: string | null;
    };

    if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `Статус должен быть: ${VALID_STATUSES.join(", ")}` } },
        { status: 400 },
      );
    }

    const update: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
    if (title !== undefined) update.title = title.trim();
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (roomId !== undefined) update.roomId = roomId;
    if (scheduledTime !== undefined) update.scheduledTime = scheduledTime ? new Date(scheduledTime) : null;
    if (notes !== undefined) update.notes = notes;

    const [updated] = await db.update(tasks).set(update).where(eq(tasks.id, id)).returning();

    if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: { code: "INVALID_ID" } }, { status: 400 });

  try {
    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    if (!deleted) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ data: { id: deleted.id } });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
