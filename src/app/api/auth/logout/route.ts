import { cookies } from "next/headers";
import { assertSameOrigin, noStore } from "@/lib/http";

export async function POST(req: Request) {
  assertSameOrigin(req);
  const jar = await cookies();
  jar.delete("icash_user");
  return Response.json({ ok: true }, { headers: noStore });
}
