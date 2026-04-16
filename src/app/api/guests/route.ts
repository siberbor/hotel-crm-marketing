import { NextRequest, NextResponse } from "next/server";
import * as guestService from "@/services/guest.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { z } from "zod";

const CreateGuestSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  preferences: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search");

  try {
    let result;
    if (search) {
      const data = await guestService.searchGuests(search);
      result = { data, total: data.length, page: 1, limit: data.length };
    } else {
      result = await guestService.getAllGuests(page, limit);
    }
    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка получения гостей" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const perm = await permissionsMiddleware(request, "guests", "create");
  if (perm) return perm;

  try {
    const body = await request.json();
    const parsed = CreateGuestSchema.safeParse(body);

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

    const guest = await guestService.createGuest(parsed.data);
    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ошибка создания гостя" } },
      { status: 500 },
    );
  }
}
