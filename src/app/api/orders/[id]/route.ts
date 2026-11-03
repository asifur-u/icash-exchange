import { DeskError, toErrorResponse } from "@/lib/errors";
import { noStore } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { getOrderForBuyer } from "@/lib/orders";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await rateLimit(`order:${clientIp(req)}`, 30, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Too many attempts. Wait a minute.");
    }
    const { id } = await context.params;
    const token = new URL(req.url).searchParams.get("t") ?? undefined;
    const order = await getOrderForBuyer(id, token);
    return Response.json({ order }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
