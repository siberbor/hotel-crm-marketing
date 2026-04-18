import { eq } from "drizzle-orm";
import { db, interactions } from "@/db";
import { sql } from "drizzle-orm";

export async function getAllInteractions(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const data = await db
    .select()
    .from(interactions)
    .limit(limit)
    .offset(offset)
    .orderBy(interactions.createdAt);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(interactions);

  return { data, total: Number(count), page, limit };
}

export async function getInteractionById(id: number) {
  const [row] = await db
    .select()
    .from(interactions)
    .where(eq(interactions.id, id))
    .limit(1);
  return row || null;
}

export async function getInteractionsByGuest(guestId: number) {
  return db
    .select()
    .from(interactions)
    .where(eq(interactions.guestId, guestId))
    .orderBy(interactions.createdAt);
}

export async function createInteraction(input: {
  guestId: number;
  bookingId?: number;
  type: "call" | "email" | "meeting" | "complaint" | "compliment";
  subject?: string;
  content?: string;
  userId?: number;
}) {
  const [created] = await db
    .insert(interactions)
    .values({
      guestId: input.guestId,
      bookingId: input.bookingId || null,
      userId: input.userId || null,
      type: input.type,
      subject: input.subject || null,
      content: input.content || null,
    })
    .returning();
  return created;
}

export async function deleteInteraction(id: number) {
  const result = await db
    .delete(interactions)
    .where(eq(interactions.id, id))
    .returning();
  return result.length > 0;
}
