export type DeskCurrency = "BDT" | "USD" | "AED" | "INR" | "PKR";

export type DeskRate = {
  code: DeskCurrency;
  name: string;
  /** Currency glyph shown in the coin mark (৳, $, ₹, …) */
  symbol: string;
  /** How many BDT equal 1 unit of this currency (PKR uses unitPerBdt instead) */
  bdtPerUnit?: number;
  /** How many units of this currency equal 1 BDT */
  unitPerBdt?: number;
  /** Wise-style rate line vs BDT */
  rateLabel: string;
};

export const DESK_RATES: DeskRate[] = [
  {
    code: "BDT",
    name: "Bangladeshi Taka",
    symbol: "৳",
    bdtPerUnit: 1,
    unitPerBdt: 1,
    rateLabel: "1.00 BDT = 1.00 BDT",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    bdtPerUnit: 128.95,
    rateLabel: "128.95 BDT = 1 USD",
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    bdtPerUnit: 35,
    rateLabel: "35 BDT = 1 AED",
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    bdtPerUnit: 1.4,
    rateLabel: "1.40 BDT = 1 INR",
  },
  {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "Rs",
    unitPerBdt: 2.3,
    rateLabel: "1 BDT = 2.3 PKR",
  },
];

export function getDeskRate(code: DeskCurrency) {
  return DESK_RATES.find((rate) => rate.code === code) ?? DESK_RATES[0];
}

/** Convert a BDT total into the selected display currency. */
export function convertFromBdt(bdtAmount: number, code: DeskCurrency) {
  const rate = getDeskRate(code);
  if (code === "BDT") return bdtAmount;
  if (rate.unitPerBdt != null) return bdtAmount * rate.unitPerBdt;
  if (rate.bdtPerUnit != null && rate.bdtPerUnit > 0) return bdtAmount / rate.bdtPerUnit;
  return bdtAmount;
}

/** Convert a display-currency amount back into BDT. */
export function convertToBdt(amount: number, code: DeskCurrency) {
  const rate = getDeskRate(code);
  if (code === "BDT") return amount;
  if (rate.unitPerBdt != null && rate.unitPerBdt > 0) return amount / rate.unitPerBdt;
  if (rate.bdtPerUnit != null) return amount * rate.bdtPerUnit;
  return amount;
}

/** Parse a typed money string like "1,000.50" into a number. */
export function parseDeskMoney(raw: string) {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** How many BDT one unit of this currency is worth. */
export function bdtValueOfOne(code: DeskCurrency) {
  const rate = getDeskRate(code);
  if (code === "BDT") return 1;
  if (rate.bdtPerUnit != null) return rate.bdtPerUnit;
  if (rate.unitPerBdt != null && rate.unitPerBdt > 0) return 1 / rate.unitPerBdt;
  return 1;
}

/** Mid-chip label between two desk currencies. */
export function pairRateLabel(from: DeskCurrency, to: DeskCurrency) {
  if (from === to) {
    const rate = getDeskRate(from);
    return `1.00 ${rate.code} = 1.00 ${rate.code}`;
  }
  if (from === "BDT") return getDeskRate(to).rateLabel;
  if (to === "BDT") {
    const rate = getDeskRate(from);
    if (rate.unitPerBdt != null) return `1 ${from} = ${(1 / rate.unitPerBdt).toFixed(4)} BDT`;
    if (rate.bdtPerUnit != null) return `1 ${from} = ${rate.bdtPerUnit} BDT`;
  }
  const fromBdt = bdtValueOfOne(from);
  const toAmount = convertFromBdt(fromBdt, to);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(toAmount);
  return `1 ${from} = ${formatted} ${to}`;
}

export function formatDeskMoney(amount: number, code: DeskCurrency) {
  const wholePreferred = code === "BDT" && Number.isInteger(amount);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: wholePreferred ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
