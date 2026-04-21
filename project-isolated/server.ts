import { createServer } from "http";
import { parse } from "url";
import next from "next";
import * as Sentry from "@sentry/nextjs";
import { initSocketServer } from "./src/ws/index";
import { startEmailWorker } from "./src/workers/email.worker";
import { startSyncWorker } from "./src/workers/sync.worker";
import { startScheduledJobs } from "./src/jobs/scheduled-sync";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      Sentry.captureException(err, { extra: { url: req.url } });
      console.error("Error handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  initSocketServer(httpServer);

  if (process.env.REDIS_URL) {
    startEmailWorker();
    startSyncWorker();
    startScheduledJobs();
    console.log("> Workers started");
  } else {
    console.log("> Workers skipped (no REDIS_URL)");
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
