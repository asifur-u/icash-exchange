import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { uploadSchema } from "@/lib/schemas";
import { uploadCodes } from "@/lib/vouchers";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!limit(`admin-codes:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 upload requests per minute.");
    }
    const body = uploadSchema.parse(await readJson(req));
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () =>
      uploadCodes(body.productSlug, body.csv),
    );
    return Response.json(result, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
