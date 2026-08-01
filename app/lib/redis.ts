import Redis from "ioredis";
const globalForRedis = global as unknown as { redis?: Redis };

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  const client = new Redis(url, {
    tls: url.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(err) {
      return err.message.includes("READONLY");
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[redis] connected");
  });

  return client;
}

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
}