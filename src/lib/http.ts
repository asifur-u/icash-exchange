import { DeskError } from "@/lib/errors";

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) {
    throw new DeskError("FORBIDDEN", "Open this page on the iCash Exchange site and try again.");
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new DeskError("FORBIDDEN", "Open this page on the iCash Exchange site and try again.");
  }
  if (originHost !== host) {
    throw new DeskError("FORBIDDEN", "Open this page on the iCash Exchange site and try again.");
  }
}

export async function readJson(req: Request) {
  const text = await req.text();
  if (text.length > 100_000) throw new DeskError("BAD_INPUT", "Request is too large");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DeskError("BAD_INPUT", "Send the form as JSON");
  }
}

export function siteOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers.get("host") ?? "";
  if (!/^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host)) return "http://localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export const noStore = { "Cache-Control": "no-store" };
