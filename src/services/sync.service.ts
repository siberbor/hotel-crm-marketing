import { eq, sql } from "drizzle-orm";
import { db, syncLogs, type SyncLog as DbSyncLog } from "@/db";

export type SyncLog = DbSyncLog;

export async function getAllSyncLogs(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(syncLogs)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${syncLogs.createdAt} DESC`),
    db.select({ total: sql<number>`count(*)` }).from(syncLogs),
  ]);

  return { data, total: Number(total), page, limit };
}

export async function addSyncLog(
  channel: string,
  action: string,
  externalId?: string,
  errorMessage?: string,
) {
  const [created] = await db
    .insert(syncLogs)
    .values({
      channel,
      action,
      externalId: externalId || null,
      status: errorMessage ? "failed" : "success",
      errorMessage: errorMessage || null,
    })
    .returning();
  return created;
}

export async function syncWithChannel(channel: string) {
  await addSyncLog(channel, "sync", undefined, undefined);
  return { success: true, channel };
}
