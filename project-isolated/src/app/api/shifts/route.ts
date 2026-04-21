import { NextRequest, NextResponse } from "next/server";
import { db, shifts } from "@/db";
import { eq, and, isNull, desc } from "drizzle-orm";

function getUser(req: NextRequest) {
  const raw = req.headers.get("x-user");
  return raw ? JSON.parse(raw) : null;
}

// GET /api/shifts — current shift for all users (for employees screen)
// GET /api/shifts?me=1 — current shift for authenticated user
export async function GET(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const me = searchParams.get("me") === "1";

    if (me) {
      const [activeShift] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.userId, user.userId), isNull(shifts.endedAt)))
        .orderBy(desc(shifts.startedAt))
        .limit(1);

      return NextResponse.json({ data: activeShift ?? null });
    }

    // All active shifts for employees screen
    const activeShifts = await db
      .select({
        shiftId: shifts.id,
        userId: shifts.userId,
        status: shifts.status,
        startedAt: shifts.startedAt,
      })
      .from(shifts)
      .where(isNull(shifts.endedAt));

    return NextResponse.json({ data: activeShifts });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

// POST /api/shifts — start shift
export async function POST(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  try {
    // Check no active shift
    const [existing] = await db
      .select({ id: shifts.id })
      .from(shifts)
      .where(and(eq(shifts.userId, user.userId), isNull(shifts.endedAt)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: { code: "SHIFT_ACTIVE", message: "Смена уже открыта" } },
        { status: 409 },
      );
    }

    const [shift] = await db
      .insert(shifts)
      .values({ userId: user.userId, status: "working" })
      .returning();

    return NextResponse.json({ data: shift }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
