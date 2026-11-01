/** Flat desk service fee applied on voucher subtotal (BDT). */
export const DESK_FEE_PERCENT = 2.5;

export function deskFeeAmount(voucherBdt: number) {
  if (!Number.isFinite(voucherBdt) || voucherBdt <= 0) return 0;
  return Math.round(voucherBdt * (DESK_FEE_PERCENT / 100));
}

export function deskPayTotal(voucherBdt: number) {
  const voucher = Math.max(0, Math.round(voucherBdt));
  return voucher + deskFeeAmount(voucher);
}

export function deskPayout(voucherBdt: number) {
  const voucher = Math.max(0, Math.round(voucherBdt));
  const fee = deskFeeAmount(voucher);
  return {
    voucher,
    fee,
    total: Math.max(0, voucher - fee),
    feePercent: DESK_FEE_PERCENT,
  };
}

export function deskBreakdown(voucherBdt: number) {
  const voucher = Math.max(0, Math.round(voucherBdt));
  const fee = deskFeeAmount(voucher);
  return {
    voucher,
    fee,
    total: voucher + fee,
    feePercent: DESK_FEE_PERCENT,
  };
}
