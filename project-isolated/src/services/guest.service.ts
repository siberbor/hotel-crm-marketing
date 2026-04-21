import { eq, ilike, or, sql } from "drizzle-orm";
import { db, guests, type Guest as DbGuest } from "@/db";
import { demoStore } from "@/lib/demo-store";

export type Guest = DbGuest;

export type CreateGuestInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
};

export type UpdateGuestInput = Partial<CreateGuestInput>;

export async function getAllGuests(page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    const [data, [{ total }]] = await Promise.all([
      db.select().from(guests).limit(limit).offset(offset).orderBy(guests.createdAt),
      db.select({ total: sql<number>`count(*)` }).from(guests),
    ]);
    if (Number(total) > 0) return { data, total: Number(total), page, limit };
    return demoStore.getGuests(page, limit) as unknown as { data: Guest[]; total: number; page: number; limit: number };
  } catch {
    return demoStore.getGuests(page, limit) as unknown as { data: Guest[]; total: number; page: number; limit: number };
  }
}

export async function getGuestById(id: number) {
  try {
    const result = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

export async function searchGuests(query: string) {
  try {
    const q = `%${query}%`;
    return db
      .select()
      .from(guests)
      .where(or(ilike(guests.firstName, q), ilike(guests.lastName, q), ilike(guests.email, q), ilike(guests.phone, q)))
      .limit(50);
  } catch {
    return demoStore.searchGuests(query) as unknown as Guest[];
  }
}

export async function createGuest(input: CreateGuestInput) {
  try {
    const result = await db
      .insert(guests)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        preferences: (input.preferences as unknown as null) || null,
        tags: (input.tags as unknown as string[]) || [],
        notes: input.notes || null,
        totalVisits: 0,
        totalSpent: "0",
      })
      .returning();
    return result[0];
  } catch {
    return demoStore.createGuest(input) as unknown as Guest;
  }
}

export async function updateGuest(id: number, input: UpdateGuestInput) {
  const result = await db
    .update(guests)
    .set({ ...input, preferences: (input.preferences as unknown as null) || undefined, tags: (input.tags as unknown as string[]) || undefined, updatedAt: new Date() })
    .where(eq(guests.id, id))
    .returning();
  return result[0] || null;
}

export async function deleteGuest(id: number) {
  const result = await db.delete(guests).where(eq(guests.id, id)).returning();
  return result.length > 0;
}
