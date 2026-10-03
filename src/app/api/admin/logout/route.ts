import { cookies } from "next/headers";
import { toErrorResponse } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const jar = await cookies();
    jar.set("vaulta_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
