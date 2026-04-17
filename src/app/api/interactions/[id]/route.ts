import { NextRequest, NextResponse } from "next/server";
import * as interactionService from "@/services/interaction.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { rateLimit } from "@/lib/rate-limit";

function parseId(params: { id: string }) {
  const id = parseInt(params.id);
  return isNaN(id) ? null : id;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const interaction = await interactionService.getInteractionById(id);
  if (!interaction) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Взаимодействие не найдено" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: interaction });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const perm = await permissionsMiddleware(request, "interactions", "delete");
  if (perm) return perm;

  const id = parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const deleted = await interactionService.deleteInteraction(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Взаимодействие не найдено" } },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
