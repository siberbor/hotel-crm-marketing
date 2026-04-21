import { spawn } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import cron from "node-cron";

function getS3Client(): S3Client {
  const endpoint = process.env.MINIO_ENDPOINT;
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    ...(endpoint && {
      endpoint: `http://${endpoint}`,
      forcePathStyle: true, // required for Minio
    }),
    credentials: {
      accessKeyId:
        process.env.MINIO_ACCESS_KEY ||
        process.env.AWS_ACCESS_KEY_ID ||
        "minioadmin",
      secretAccessKey:
        process.env.MINIO_SECRET_KEY ||
        process.env.AWS_SECRET_ACCESS_KEY ||
        "minioadmin",
    },
  });
}

async function runBackup(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[Backup] DATABASE_URL not set, skipping");
    return;
  }

  const bucket = process.env.MINIO_BUCKET || "hotel-crm";
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const tsStr = now.toISOString().replace(/[:.]/g, "-");
  const key = `backups/${dateStr}/hotel_crm_${tsStr}.sql.gz`;

  console.log(`[Backup] Starting → s3://${bucket}/${key}`);

  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const pgDump = spawn("pg_dump", [dbUrl, "--no-password", "--format=plain"]);
    const gzip = spawn("gzip", ["-c"]);

    pgDump.stdout.pipe(gzip.stdin);

    gzip.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    pgDump.stderr.on("data", (d: Buffer) =>
      console.error("[Backup] pg_dump:", d.toString().trim())
    );
    gzip.stderr.on("data", (d: Buffer) =>
      console.error("[Backup] gzip:", d.toString().trim())
    );

    pgDump.on("error", (err) =>
      reject(new Error(`pg_dump not found: ${err.message}`))
    );
    gzip.on("error", reject);
    gzip.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`gzip exited with code ${code}`));
    });
  });

  const body = Buffer.concat(chunks);
  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/gzip",
      ContentLength: body.length,
    })
  );

  const mb = (body.length / 1024 / 1024).toFixed(2);
  console.log(`[Backup] Done: ${key} (${mb} MB)`);
}

export function startBackupJob(): void {
  // Daily at 03:00 server time
  cron.schedule("0 3 * * *", async () => {
    try {
      await runBackup();
    } catch (err) {
      console.error("[Backup] Failed:", err);
    }
  });

  console.log("[Jobs] Backup job scheduled (daily 03:00)");
}
