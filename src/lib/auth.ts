import { createHmac, timingSafeEqual } from "node:crypto";
import { DeskError } from "@/lib/errors";
import { getAuthSecret } from "@/lib/secrets";

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signOrderAccess(orderId: string) {
  return createHmac("sha256", getAuthSecret()).update(`order:${orderId}`).digest("base64url");
}

export function assertOrderToken(orderId: string, token: string | undefined) {
  const expected = signOrderAccess(orderId);
  if (!token || !same(token, expected)) {
    throw new DeskError("UNAUTHORIZED", "This link is not valid.");
  }
}

export function signAdminSession(userId: string) {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = `admin.${userId}.${exp}`;
  const sig = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Returns the owner user id when the cookie is valid. Role is checked separately in the database. */
export function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role, userId, exp, sig] = parts;
  if (!role || !userId || !exp || !sig) return null;
  let expected: string;
  try {
    expected = createHmac("sha256", getAuthSecret()).update(`${role}.${userId}.${exp}`).digest("base64url");
  } catch {
    return null;
  }
  if (role !== "admin" || !same(sig, expected)) return null;
  if (Number(exp) <= Date.now()) return null;
  return userId;
}

export function signUserSession(userId: string) {
  // 7 days — aligns with cookie maxAge in user-session helper
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `user.${userId}.${exp}`;
  const sig = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUserSession(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role, userId, exp, sig] = parts;
  if (!role || !userId || !exp || !sig) return null;
  let expected: string;
  try {
    expected = createHmac("sha256", getAuthSecret()).update(`${role}.${userId}.${exp}`).digest("base64url");
  } catch {
    // Missing AUTH_SECRET in production — treat as logged out instead of crashing the page.
    return null;
  }
  if (role !== "user" || !same(sig, expected)) return null;
  if (Number(exp) <= Date.now()) return null;
  return userId;
}
