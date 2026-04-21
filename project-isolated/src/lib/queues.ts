import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export type EmailJobData =
  | { type: "campaign"; campaignId: number }
  | { type: "booking_confirmation"; bookingId: number }
  | { type: "booking_cancellation"; bookingId: number };

export type SyncJobData =
  | { type: "full_sync" }
  | { type: "push_rates"; roomId?: number }
  | { type: "fetch_bookings" };

let emailQueue: Queue<EmailJobData> | null = null;
let syncQueue: Queue<SyncJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJobData>("email", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return emailQueue;
}

export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    syncQueue = new Queue<SyncJobData>("sync", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  }
  return syncQueue;
}
