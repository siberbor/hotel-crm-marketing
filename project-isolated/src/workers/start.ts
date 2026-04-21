// Worker process entry point — runs BullMQ workers + scheduled jobs
// Separate from Next.js app process
import { startEmailWorker } from "./email.worker";
import { startSyncWorker } from "./sync.worker";
import { startScheduledJobs } from "@/jobs/scheduled-sync";
import { startBackupJob } from "@/jobs/backup";

console.log("[Workers] Starting...");

const emailWorker = startEmailWorker();
const syncWorker = startSyncWorker();
startScheduledJobs();
startBackupJob();

console.log("[Workers] All workers running");

const shutdown = async () => {
  console.log("[Workers] Shutting down...");
  await Promise.all([emailWorker.close(), syncWorker.close()]);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
