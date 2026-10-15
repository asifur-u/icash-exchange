import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DeskError } from "@/lib/errors";
import { getAuthSecret } from "@/lib/secrets";

const COOKIE = "icash_csrf";

function sign(nonce: string) {
  return createHmac("sha256", getAuthSecret()).update(`csrf:${nonce}`).digest("base64url");
}

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function csrfCookieName() {
  return COOKIE;
}

/** Issue a CSRF nonce + signed cookie value. */
export function issueCsrf() {
  const nonce = randomBytes(24).toString("base64url");
  return {
    token: nonce,
    cookieValue: `${nonce}.${sign(nonce)}`,
  };
}

/** Require matching X-CSRF-Token header against signed cookie. */
export function assertCsrf(req: Request) {
  const header = req.headers.get("x-csrf-token")?.trim() ?? "";
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s*)icash_csrf=([^;]+)/);
  const cookieValue = match?.[1] ? decodeURIComponent(match[1]) : "";
  if (!header || !cookieValue) {
    throw new DeskError("FORBIDDEN", "Security check failed. Refresh the page and try again.");
  }
  const [nonce, sig] = cookieValue.split(".");
  if (!nonce || !sig || nonce !== header || !same(sig, sign(nonce))) {
    throw new DeskError("FORBIDDEN", "Security check failed. Refresh the page and try again.");
  }
}

export function csrfCookieOptions(maxAgeSec = 2 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}
