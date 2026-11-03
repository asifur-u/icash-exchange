import { createAdmin, listAdmins } from "@/lib/admins";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { adminAccountSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const me = await requireAdmin();
    const staff = await listAdmins();
    return Response.json({ me, staff }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const me = await requireAdmin();
    if (!(await rateLimit(`admin-staff:${clientIp(req)}`, 6, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 6 owner changes per minute.");
    }
    const body = adminAccountSchema.parse(await readJson(req));
    const admin = await createAdmin(me.id, body);
    return Response.json({ ok: true, admin }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
