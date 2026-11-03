import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/prisma";
import { redisConfigured, redisPing } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const redis = redisConfigured() ? await redisPing() : false;
  return NextResponse.json(
    { ok: true, db: databaseConfigured(), redis },
    { headers: { "Cache-Control": "no-store" } },
  );
}
