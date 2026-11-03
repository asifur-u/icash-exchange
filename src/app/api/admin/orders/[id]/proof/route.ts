import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { noStore } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { readPaymentProof } from "@/lib/proofs";
import { proofFileFor } from "@/lib/orders";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    if (!(await rateLimit(`admin-proof:${clientIp(req)}`, 3, 10_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 proof views every 10 seconds.");
    }
    const { id } = await context.params;
    const proofFile = await proofFileFor(id);
    if (proofFile.startsWith("https://") || proofFile.startsWith("http://")) {
      return Response.redirect(proofFile, 302);
    }
    const { bytes, type } = await readPaymentProof(proofFile);
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...noStore,
        "Content-Type": type,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
