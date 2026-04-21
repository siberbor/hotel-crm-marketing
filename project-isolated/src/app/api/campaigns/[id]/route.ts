import { NextRequest, NextResponse } from "next/server";
import * as campaignService from "@/services/campaign.service";
import { permissionsMiddleware } from "@/middleware/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  segmentId: z.number().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

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

  const campaign = await campaignService.getCampaignById(id);
  if (!campaign) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Кампания не найдена" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: campaign });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const perm = await permissionsMiddleware(request, "campaigns", "update");
  if (perm) return perm;

  const id = parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = UpdateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  const existing = await campaignService.getCampaignById(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Кампания не найдена" } },
      { status: 404 },
    );
  }
  if (existing.status === "sent") {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Отправленную кампанию нельзя редактировать" } },
      { status: 409 },
    );
  }

  const { scheduledAt, ...rest } = parsed.data;
  const updated = await campaignService.updateCampaign(id, {
    ...rest,
    ...(scheduledAt !== undefined
      ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
      : {}),
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const perm = await permissionsMiddleware(request, "campaigns", "delete");
  if (perm) return perm;

  const id = parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Некорректный ID" } },
      { status: 400 },
    );
  }

  const existing = await campaignService.getCampaignById(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Кампания не найдена" } },
      { status: 404 },
    );
  }

  await campaignService.deleteCampaign(id);
  return new NextResponse(null, { status: 204 });
}
