// Demo rate limits and webhook idempotency live in process memory and the local store.
// On Vercel, point UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN at Upstash
// and switch src/lib/limit.ts to @upstash/ratelimit. Use QStash or Inngest for delivery
// jobs there. Keep BullMQ for a VPS, where a worker process can stay running.

export function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
