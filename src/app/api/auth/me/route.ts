import { noStore } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user }, { headers: noStore });
}
