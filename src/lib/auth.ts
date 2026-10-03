import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { DeskError } from "@/lib/errors";
import { getAdminPassword, getAuthSecret } from "@/lib/secrets";

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

export function signAdminSession() {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = `admin.${exp}`;
  const sig = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  if (!role || !exp || !sig) return false;
  const expected = createHmac("sha256", getAuthSecret()).update(`${role}.${exp}`).digest("base64url");
  if (role !== "admin" || !same(sig, expected)) return false;
  return Number(exp) > Date.now();
}

export function adminPasswordMatches(input: string) {
  const expected = getAdminPassword();
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}
