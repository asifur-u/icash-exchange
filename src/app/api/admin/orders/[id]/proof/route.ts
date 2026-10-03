import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { noStore } from "@/lib/http";
import { readPaymentProof } from "@/lib/proofs";
import { withStore } from "@/lib/store";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const proofFile = await withStore((db) => {
      const order = db.orders.find((item) => item.id === id);
      if (!order?.proofFile) throw new DeskError("NOT_FOUND", "No screenshot on this order");
      return order.proofFile;
    });
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
