import { NextRequest, NextResponse } from "next/server";
import * as guestService from "@/services/guest.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { z } from "zod";

const UpdateGuestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  preferences: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  totalVisits: z.number().optional(),
  totalSpent: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const guest = await guestService.getGuestById(id);
  if (!guest) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Гость не найден" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: guest });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const perm = await permissionsMiddleware(request, "guests", "update");
  if (perm) return perm;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0].message,
          },
        },
        { status: 400 },
      );
    }

    const guest = await guestService.updateGuest(id, parsed.data);
    if (!guest) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Гость не найден" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: guest });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка обновления гостя" } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const perm = await permissionsMiddleware(request, "guests", "delete");
  if (perm) return perm;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const deleted = await guestService.deleteGuest(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Гость не найден" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { success: true } });
}
