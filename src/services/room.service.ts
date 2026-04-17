import { eq, asc } from "drizzle-orm";
import { db, rooms, type Room as DbRoom } from "@/db";
import { demoStore } from "@/lib/demo-store";

export type Room = DbRoom;

export async function getAllRooms() {
  try {
    return await db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(asc(rooms.number));
  } catch {
    return demoStore.getRooms() as unknown as Room[];
  }
}

export async function getRoomById(id: number) {
  try {
    const [row] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return row || null;
  } catch {
    return (demoStore.getRooms().find((r) => r.id === id) as unknown as Room) || null;
  }
}

export async function createRoom(input: {
  number: string;
  type: string;
  floor: number;
  pricePerNight: string;
  capacity: number;
  amenities?: string[];
}) {
  const [created] = await db
    .insert(rooms)
    .values({
      number: input.number,
      type: input.type,
      floor: input.floor,
      pricePerNight: input.pricePerNight,
      capacity: input.capacity,
      amenities: (input.amenities as unknown as string[]) || [],
      isActive: true,
    })
    .returning();
  return created;
}

export async function updateRoom(id: number, input: Partial<Omit<Room, "id" | "createdAt">>) {
  const [updated] = await db.update(rooms).set(input).where(eq(rooms.id, id)).returning();
  return updated || null;
}

export async function deleteRoom(id: number) {
  const [deleted] = await db.delete(rooms).where(eq(rooms.id, id)).returning({ id: rooms.id });
  return !!deleted;
}
