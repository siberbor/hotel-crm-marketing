import { db, syncLogs } from "@/db";

type SyncResult = {
  success: boolean;
  itemsProcessed: number;
  errorMessage?: string;
};

async function logSync(
  action: string,
  status: "success" | "error" | "partial",
  errorMessage?: string
) {
  try {
    await db.insert(syncLogs).values({
      channel: "channel_manager",
      action,
      status,
      errorMessage: errorMessage ?? null,
    });
  } catch {
    console.log(`[CM] Sync log: ${action} → ${status}`);
  }
}

export const channelManagerService = {
  async fetchBookings(): Promise<SyncResult> {
    // Mock: в реальной интеграции здесь HTTP запрос к CM API
    await new Promise((r) => setTimeout(r, 200));
    const result: SyncResult = { success: true, itemsProcessed: 0 };
    await logSync("fetch_bookings", "success");
    return result;
  },

  async pushRates(roomId?: number): Promise<SyncResult> {
    await new Promise((r) => setTimeout(r, 150));
    const result: SyncResult = { success: true, itemsProcessed: roomId ? 1 : 10 };
    await logSync("push_rates", "success");
    return result;
  },

  async fetchAvailability(): Promise<SyncResult> {
    await new Promise((r) => setTimeout(r, 100));
    const result: SyncResult = { success: true, itemsProcessed: 30 };
    await logSync("fetch_availability", "success");
    return result;
  },
};
