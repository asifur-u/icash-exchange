import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as { __icashRedis?: RedisClientType };

export function redisUrl() {
  return process.env.REDIS_URL?.trim() ?? "";
}

export function redisConfigured() {
  const url = redisUrl();
  return url.startsWith("redis://") || url.startsWith("rediss://");
}

export function upstashConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  return Boolean(url.startsWith("https://") && token);
}

async function getRedis() {
  if (!redisConfigured()) return null;
  const existing = globalForRedis.__icashRedis;
  if (existing?.isOpen) return existing;
  const client = createClient({
    url: redisUrl(),
    socket: { connectTimeout: 1500, reconnectStrategy: (retries) => Math.min(retries * 200, 2000) },
  });
  client.on("error", () => undefined);
  await client.connect();
  globalForRedis.__icashRedis = client;
  return client;
}

/** INCR + PEXPIRE. Returns the new count, or null if Redis is not up. */
export async function redisIncrExpire(key: string, windowMs: number) {
  const client = await getRedis().catch(() => null);
  if (!client) return null;
  try {
    const count = await client.incr(key);
    if (count === 1) await client.pExpire(key, windowMs + 1000);
    return count;
  } catch {
    return null;
  }
}

export async function redisPing() {
  const client = await getRedis().catch(() => null);
  if (!client) return false;
  try {
    return (await client.ping()) === "PONG";
  } catch {
    return false;
  }
}
