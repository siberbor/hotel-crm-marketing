import { NextRequest, NextResponse } from "next/server";
import * as campaignService from "@/services/campaign.service";
import { permissionsMiddleware } from "@/middleware/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const perm = await permissionsMiddleware(request, "campaigns", "send");
  if (perm) return perm;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  try {
    const campaign = await campaignService.sendCampaign(id);
    if (!campaign) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Кампания не найдена" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: campaign });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка отправки кампании" },
      },
      { status: 500 },
    );
  }
}
