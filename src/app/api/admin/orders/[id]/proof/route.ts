import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { noStore } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { readPaymentProof } from "@/lib/proofs";
import { withStore } from "@/lib/store";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    if (!limit(`admin-proof:${clientIp(req)}`, 3, 10_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 proof views every 10 seconds.");
    }
    const { id } = await context.params;
    const proofFile = await withStore((db) => {
      const order = db.orders.find((item) => item.id === id);
      if (!order?.proofFile) throw new DeskError("NOT_FOUND", "No screenshot on this order");
      return order.proofFile;
    });
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
