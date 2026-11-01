import { randomBytes } from "node:crypto";
import { codeHash, decrypt, encrypt } from "@/lib/crypto";
import { deskPayout } from "@/lib/desk-fee";
import { DeskError } from "@/lib/errors";
import { addAudit, withStore } from "@/lib/store";
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

  return withStore((db) => {
    const quote = deskPayout(input.faceValue);
    const clash = db.sells.find((item) => item.voucherHash === hash && item.status !== "REJECTED");
    if (clash) throw new DeskError("DUPLICATE_CODE", "That voucher is already on the desk");

    const id = `sel_${randomBytes(8).toString("hex")}`;
    const number = `SX-${String(db.nextNumber).padStart(4, "0")}`;
    db.nextNumber += 1;
    db.sells.push({
      id,
      number,
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      phone: input.phone,
      faceValue: quote.voucher,
      payout: quote.total,
      method: input.method,
      payoutNumber: input.payoutNumber.trim(),
      voucherCipher: encrypt(code),
      voucherHash: hash,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    });
    addAudit(db, input.email, "sell.create", id);
    return { number };
  });
}

export async function listSells() {
  return withStore((db) =>
    [...db.sells].reverse().slice(0, 40).map((item) => ({
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
      createdAt: item.createdAt,
    })),
  );
}

export async function settleSell(id: string, status: Extract<SellStatus, "PAID" | "REJECTED">) {
  return withStore((db) => {
    const sell = db.sells.find((item) => item.id === id);
    if (!sell) throw new DeskError("NOT_FOUND", "That sale is not on the desk");
    if (sell.status !== "OPEN") throw new DeskError("NOT_PAYABLE", "That sale is already closed");
    sell.status = status;
    sell.settledAt = new Date().toISOString();
    addAudit(db, "admin", status === "PAID" ? "sell.paid" : "sell.reject", id);
    return { id, status };
  });
}
