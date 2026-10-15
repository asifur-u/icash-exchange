import { cookies } from "next/headers";
import { csrfCookieName, csrfCookieOptions, issueCsrf } from "@/lib/csrf";
import { noStore } from "@/lib/http";

export async function GET() {
  const issued = issueCsrf();
  const jar = await cookies();
  jar.set(csrfCookieName(), issued.cookieValue, csrfCookieOptions());
  return Response.json({ token: issued.token }, { headers: noStore });
}
