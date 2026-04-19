import { NextRequest, NextResponse } from "next/server";
import { db, shifts } from "@/db";
import { eq, and } from "drizzle-orm";

function getUser(req: NextRequest) {
  const raw = req.headers.get("x-user");
  return raw ? JSON.parse(raw) : null;
}

// PATCH /api/shifts/[id] — update status: break | working | done (end shift)
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
    const { status } = body as { status?: string };

    const validStatuses = ["working", "break", "done"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `status: ${validStatuses.join(" | ")}` } },
        { status: 400 },
      );
    }

    const update: Partial<typeof shifts.$inferInsert> = { status };
    if (status === "done") update.endedAt = new Date();

    const [updated] = await db
      .update(shifts)
      .set(update)
      .where(and(eq(shifts.id, id), eq(shifts.userId, user.userId)))
      .returning();

    if (!updated) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
