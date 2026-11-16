import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { normalizeWalletNumber, saveDepositAccount } from "@/lib/deposit-store";
import { z } from "zod";

const walletSchema = z.object({
  id: z.enum(["bkash", "nagad", "rocket", "bank"]),
  number: z.string().trim().min(8, "Enter the receiving number").max(40),
  name: z.string().trim().min(2, "Enter the account name").max(80),
});

async function save(req: Request) {
  assertSameOrigin(req);
  const me = await requireAdmin();
  if (!(await rateLimit(`admin-deposit:${clientIp(req)}`, 12, 60_000))) {
    throw new DeskError("RATE_LIMITED", "Max 12 wallet changes per minute.");
  }
  const body = walletSchema.parse(await readJson(req));
  const kind = body.id === "bank" ? "bank" : "mobile";
  const number = normalizeWalletNumber(body.number, kind);
  if (kind === "mobile" && !/^01\d{9}$/.test(number)) {
    throw new DeskError("BAD_INPUT", "Use an 11-digit mobile number starting with 01");
  }
  if (kind === "bank" && !/^[0-9]{6,20}$/.test(number)) {
    throw new DeskError("BAD_INPUT", "Enter a valid bank account number");
  }
  const account = await saveDepositAccount(body.id, { number, name: body.name }, me.id);
  return Response.json({ ok: true, account }, { headers: noStore });
}

export async function POST(req: Request) {
  try {
    return await save(req);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    return await save(req);
  } catch (error) {
    return toErrorResponse(error);
  }
}
