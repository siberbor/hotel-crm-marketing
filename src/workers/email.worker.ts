import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "@/lib/redis";
import type { EmailJobData } from "@/lib/queues";

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  console.log(`[EmailWorker] Processing job ${job.id}:`, job.data);

  const { type } = job.data;

  switch (type) {
    case "campaign": {
      const { campaignId } = job.data;
      await job.updateProgress(10);
      // Dynamically import to avoid loading email service if Redis unavailable
      const { sendCampaignEmails } = await import("@/services/email.service");
      await sendCampaignEmails(campaignId);
      await job.updateProgress(100);
      console.log(`[EmailWorker] Campaign ${campaignId} emails sent`);
      break;
    }
    case "booking_confirmation": {
      const { bookingId } = job.data;
      await job.updateProgress(10);
      const { sendBookingConfirmation } = await import("@/services/email.service");
      await sendBookingConfirmation(bookingId);
      await job.updateProgress(100);
      console.log(`[EmailWorker] Booking ${bookingId} confirmation sent`);
      break;
    }
    case "booking_cancellation": {
      const { bookingId } = job.data;
      await job.updateProgress(10);
      const { sendBookingCancellation } = await import("@/services/email.service");
      await sendBookingCancellation(bookingId);
      await job.updateProgress(100);
      console.log(`[EmailWorker] Booking ${bookingId} cancellation sent`);
      break;
    }
    default:
      throw new Error(`Unknown email job type: ${(job.data as { type: string }).type}`);
  }
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>("email", processEmailJob, {
    connection: getRedisConnection(),
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
