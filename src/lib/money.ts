import { DeskError } from "@/lib/errors";

export function lineTotal(unitPrice: number, quantity: number) {
  if (!Number.isInteger(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000) {
    throw new DeskError("BAD_INPUT", "That price is not valid");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    throw new DeskError("BAD_INPUT", "Choose between 1 and 5 notes");
  }
  return unitPrice * quantity;
}
