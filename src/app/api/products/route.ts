import { toErrorResponse } from "@/lib/errors";
import { noStore } from "@/lib/http";
import { getPublicProducts } from "@/lib/store";

export async function GET() {
  try {
    const products = await getPublicProducts();
    return Response.json({ products }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
