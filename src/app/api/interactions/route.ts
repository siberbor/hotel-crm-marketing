import { NextRequest, NextResponse } from "next/server";
import * as interactionService from "@/services/interaction.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { z } from "zod";

const CreateInteractionSchema = z.object({
  guestId: z.number({ required_error: "ID гостя обязателен" }),
  bookingId: z.number().optional(),
  type: z.enum(["call", "email", "meeting", "complaint", "compliment"]),
  subject: z.string().optional(),
  content: z.string().optional(),
  userId: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const guestId = searchParams.get("guestId");

  try {
    let result;
    if (guestId) {
      const data = await interactionService.getInteractionsByGuest(
        parseInt(guestId),
      );
      result = { data, total: data.length, page: 1, limit: data.length };
    } else {
      result = await interactionService.getAllInteractions(page, limit);
    }
    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка получения взаимодействий",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const perm = await permissionsMiddleware(request, "interactions", "create");
  if (perm) return perm;

  try {
    const body = await request.json();
    const parsed = CreateInteractionSchema.safeParse(body);

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

    const interaction = await interactionService.createInteraction(parsed.data);
    return NextResponse.json({ data: interaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка создания взаимодействия",
        },
      },
      { status: 500 },
    );
  }
}
