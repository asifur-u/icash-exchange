// Rate limits use Upstash Redis REST directly (src/lib/limit.ts → rateLimit) when these are set,
// so every serverless instance shares one counter. Without them each instance counts on its own.

export function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
