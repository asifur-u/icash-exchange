import { toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, readJson } from "@/lib/http";
import { uploadSchema } from "@/lib/schemas";
import { uploadCodes } from "@/lib/vouchers";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const body = uploadSchema.parse(await readJson(req));
    const result = await uploadCodes(body.productSlug, body.csv);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
