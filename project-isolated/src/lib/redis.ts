import IORedis from "ioredis";

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new IORedis(url, { maxRetriesPerRequest: null });
    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return redis;
}

export function getRedisConnection() {
  return new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}
