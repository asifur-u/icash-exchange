import { codeHash, decrypt, encrypt } from "@/lib/crypto";
import { getPrisma, isUniqueViolation, transaction } from "@/lib/db";
import { deskPayout } from "@/lib/desk-fee";
import { DeskError } from "@/lib/errors";
import { addAudit, newId, nextNumber } from "@/lib/store";
import type { PaymentMethod, SellStatus } from "@/lib/types";

export async function createSell(input: {
  name: string;
  email: string;
  phone: string;
  faceValue: number;
  method: PaymentMethod;
  payoutNumber: string;
  voucherCode: string;
}) {
  const code = input.voucherCode.trim();
  const hash = codeHash(code);
  const quote = deskPayout(input.faceValue);
  const email = input.email.toLowerCase();

  try {
    return await transaction(async (tx) => {
      const clash = await tx.sell.findFirst({
        where: { voucherHash: hash, status: { not: "REJECTED" } },
        select: { id: true },
      });
      if (clash) throw new DeskError("DUPLICATE_CODE", "That voucher is already on the desk");

      const id = newId("sel");
      const number = await nextNumber(tx, "SX");
      await tx.sell.create({
        data: {
          id,
          number,
          name: input.name.trim(),
          email,
          phone: input.phone,
          faceValue: quote.voucher,
          payout: quote.total,
          method: input.method,
          payoutNumber: input.payoutNumber.trim(),
          voucherCipher: encrypt(code),
          voucherHash: hash,
        },
      });
      await addAudit(tx, email, "sell.create", id);
      return { number, faceValue: quote.voucher, payout: quote.total };
    });
  } catch (error) {
    if (isUniqueViolation(error, "voucherHash")) {
      throw new DeskError("DUPLICATE_CODE", "That voucher is already on the desk");
    }
    throw error;
  }
}

export async function listSells() {
  const rows = await getPrisma().sell.findMany({ orderBy: { createdAt: "desc" }, take: 40 });
  return rows.map((item) => ({
    id: item.id,
    number: item.number,
    name: item.name,
    email: item.email,
    phone: item.phone,
    faceValue: item.faceValue,
    payout: item.payout,
    method: item.method,
    payoutNumber: item.payoutNumber,
    code: decrypt(item.voucherCipher),
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function settleSell(id: string, status: Extract<SellStatus, "PAID" | "REJECTED">) {
  return transaction(async (tx) => {
    const moved = await tx.sell.updateMany({
      where: { id, status: "OPEN" },
      data: { status, settledAt: new Date() },
    });
    if (moved.count === 0) {
      const exists = await tx.sell.findUnique({ where: { id }, select: { id: true } });
      if (!exists) throw new DeskError("NOT_FOUND", "That sale is not on the desk");
      throw new DeskError("NOT_PAYABLE", "That sale is already closed");
    }
    const sell = await tx.sell.findUniqueOrThrow({ where: { id } });
    await addAudit(tx, "admin", status === "PAID" ? "sell.paid" : "sell.reject", id);
    return {
      id,
      status,
      notice: {
        email: sell.email,
        number: sell.number,
        status,
        faceValue: sell.faceValue,
        payout: sell.payout,
        method: sell.method,
        payoutNumber: sell.payoutNumber,
      },
    };
  });
}
