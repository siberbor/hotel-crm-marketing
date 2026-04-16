import { NextRequest, NextResponse } from "next/server";
import * as campaignService from "@/services/campaign.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { z } from "zod";

const CreateCampaignSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  subject: z.string().min(1, "Тема обязательна"),
  content: z.string().min(1, "Содержание обязательно"),
  segmentId: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const result = await campaignService.getAllCampaigns(page, limit);
    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка получения кампаний" },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const perm = await permissionsMiddleware(request, "campaigns", "create");
  if (perm) return perm;

  try {
    const body = await request.json();
    const parsed = CreateCampaignSchema.safeParse(body);

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

    const campaign = await campaignService.createCampaign(parsed.data);
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Ошибка создания кампании" },
      },
      { status: 500 },
    );
  }
}
