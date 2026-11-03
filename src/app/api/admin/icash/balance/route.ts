import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { noStore } from "@/lib/http";
import { IcashError, icashBalance, icashConfigured, icashMessage } from "@/lib/icash";
import { clientIp, rateLimit } from "@/lib/limit";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    if (!(await rateLimit(`admin-icash-balance:${clientIp(req)}`, 10, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 10 balance checks per minute.");
    }
    if (!icashConfigured()) {
      return Response.json(
        { ok: false, term: "not_configured", message: icashMessage("not_configured") },
        { headers: noStore },
      );
    }
    try {
      const balance = await icashBalance();
      return Response.json({ ok: true, ...balance, checkedAt: new Date().toISOString() }, { headers: noStore });
    } catch (error) {
      if (!(error instanceof IcashError)) throw error;
      return Response.json({ ok: false, term: error.term, message: error.message }, { headers: noStore });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}
