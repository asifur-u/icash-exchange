const hits = new Map<string, number[]>();
const inflight = new Map<string, number>();

/** Sliding-window rate limit. Returns false when too many hits. */
export function limit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith("https://")) return null;
  return { url: url.replace(/\/$/, ""), token };
}

/**
 * Fixed-window rate limit shared by every server instance (Upstash Redis REST).
 * Falls back to the in-memory limiter when Upstash is not set or does not answer.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const redis = upstash();
  if (!redis) return limit(key, max, windowMs);
  const bucket = `icx:rl:${process.env.NODE_ENV ?? "dev"}:${key}:${Math.floor(Date.now() / windowMs)}`;
  try {
    const response = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", bucket],
        ["PEXPIRE", bucket, String(windowMs + 1000)],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error(`upstash_${response.status}`);
    const [first] = (await response.json()) as Array<{ result?: number; error?: string }>;
    if (typeof first?.result !== "number") throw new Error("upstash_bad_reply");
    return first.result <= max;
  } catch {
    return limit(key, max, windowMs);
  }
}

/**
 * Max N overlapping requests for a key (e.g. 3 at a time).
 * Call release() in a finally block.
 */
export function acquireSlot(key: string, max = 3): (() => void) | null {
  const current = inflight.get(key) ?? 0;
  if (current >= max) return null;
  inflight.set(key, current + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = (inflight.get(key) ?? 1) - 1;
    if (next <= 0) inflight.delete(key);
    else inflight.set(key, next);
  };
}

export async function withConcurrency<T>(key: string, max: number, fn: () => Promise<T>): Promise<T> {
  const release = acquireSlot(key, max);
  if (!release) {
    const { DeskError } = await import("@/lib/errors");
    throw new DeskError("RATE_LIMITED", "Too many requests at once. Wait for the current ones to finish.");
  }
  try {
    return await fn();
  } finally {
    release();
  }
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return req.headers.get("x-real-ip") ?? "local";
}

/** Clears in-memory rate-limit buckets (dev/smoke only). */
export function resetLimits() {
  hits.clear();
  inflight.clear();
}
