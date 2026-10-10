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
