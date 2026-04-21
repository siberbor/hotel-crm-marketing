import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import type { SyncJobData } from "@/lib/queues";

async function processSyncJob(job: Job<SyncJobData>): Promise<void> {
  console.log(`[SyncWorker] Processing job ${job.id}:`, job.data);

  const { type } = job.data;
  const { channelManagerService } = await import("@/integrations/channel-manager");

  switch (type) {
    case "full_sync": {
      await job.updateProgress(10);
      await channelManagerService.fetchBookings();
      await job.updateProgress(50);
      await channelManagerService.pushRates();
      await job.updateProgress(100);
      console.log("[SyncWorker] Full sync completed");
      break;
    }
    case "push_rates": {
      const roomId = "roomId" in job.data ? job.data.roomId : undefined;
      await channelManagerService.pushRates(roomId);
      await job.updateProgress(100);
      console.log(`[SyncWorker] Rates pushed${roomId ? ` for room ${roomId}` : ""}`);
      break;
    }
    case "fetch_bookings": {
      await channelManagerService.fetchBookings();
      await job.updateProgress(100);
      console.log("[SyncWorker] Bookings fetched from channel manager");
      break;
    }
    default:
      throw new Error(`Unknown sync job type: ${(job.data as { type: string }).type}`);
  }
}

export function startSyncWorker() {
  const worker = new Worker<SyncJobData>("sync", processSyncJob, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`[SyncWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[SyncWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
