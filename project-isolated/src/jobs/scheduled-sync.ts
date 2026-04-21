import cron from "node-cron";
import { getSyncQueue } from "@/lib/queues";

export function startScheduledJobs() {
  // Full channel sync every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const queue = getSyncQueue();
      await queue.add("full_sync", { type: "full_sync" });
      console.log("[Jobs] Queued hourly full_sync");
    } catch (err) {
      console.error("[Jobs] Failed to queue full_sync:", err);
    }
  });

  // Rate push every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const queue = getSyncQueue();
      await queue.add("push_rates", { type: "push_rates" });
      console.log("[Jobs] Queued push_rates");
    } catch (err) {
      console.error("[Jobs] Failed to queue push_rates:", err);
    }
  });

  console.log("[Jobs] Scheduled jobs started");
}
