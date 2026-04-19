import { eq, sql } from "drizzle-orm";
import { db, campaigns, type Campaign as DbCampaign } from "@/db";

export type Campaign = DbCampaign;

export type CreateCampaignInput = {
  name: string;
  subject: string;
  content: string;
  segmentId?: number | null;
};

export async function getAllCampaigns(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(campaigns)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${campaigns.createdAt} DESC`),
    db.select({ total: sql<number>`count(*)` }).from(campaigns),
  ]);

  return { data, total: Number(total), page, limit };
}

export async function getCampaignById(id: number) {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  return row || null;
}

export async function createCampaign(input: CreateCampaignInput) {
  const [created] = await db
    .insert(campaigns)
    .values({
      name: input.name,
      subject: input.subject,
      content: input.content,
      segmentId: input.segmentId || null,
      status: "draft",
      scheduledAt: null,
      sentAt: null,
      stats: null,
    })
    .returning();
  return created;
}

export async function updateCampaign(
  id: number,
  input: Partial<
    CreateCampaignInput & {
      status: Campaign["status"];
      scheduledAt: Date | null;
      sentAt: Date | null;
      stats: Campaign["stats"];
    }
  >,
) {
  const [updated] = await db
    .update(campaigns)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  return updated || null;
}

export async function sendCampaign(id: number) {
  const campaign = await getCampaignById(id);
  if (!campaign) return null;

  const [updated] = await db
    .update(campaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      stats: (campaign.stats as any) || { sent: 0, opened: 0, clicked: 0 },
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id))
    .returning();
  return updated;
}

export async function deleteCampaign(id: number) {
  const [deleted] = await db
    .delete(campaigns)
    .where(eq(campaigns.id, id))
    .returning({ id: campaigns.id });
  return !!deleted;
}
