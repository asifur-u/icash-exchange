export type OrderStatus = "PENDING" | "REVIEWING" | "PAID" | "DELIVERED" | "FAILED" | "REFUNDED";
export type CodeStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "VOID";
export type PaymentMethod = "bkash" | "nagad" | "rocket" | "bank";
export type SellStatus = "OPEN" | "PAID" | "REJECTED";

export type IssuanceStatus = "ISSUING" | "ISSUED" | "FAILED";
export type IssuanceDelivery = "icash" | "desk";

/** An iCash voucher as the admin desk sees it — never includes full codes. */
export type IssuanceView = {
  status: IssuanceStatus;
  delivery: IssuanceDelivery;
  environment: "test" | "production";
  attempts: number;
  startedAt: string;
  issuedAt?: string;
  uuid?: string;
  currency?: string;
  /** Face value of the voucher, in the card currency. */
  amount?: number;
  /** What iCash charged the reseller balance (total_amount, reseller currency). */
  cost?: number;
  exchangeRate?: number;
  /** Masked codes, e.g. ******ab12cd. */
  masked?: string[];
  error?: string;
  errorMessage?: string;
};

export type Audit = {
  id: string;
  actor: string;
  action: string;
  targetId?: string;
  createdAt: string;
};

export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  faceValue: number;
  price: number;
  stock: number;
};

export type AdminSnapshot = {
  products: Array<
    PublicProduct & {
      reserved: number;
      sold: number;
      voided: number;
    }
  >;
  orders: Array<{
    id: string;
    number: string;
    email: string;
    name?: string;
    phone?: string;
    status: OrderStatus;
    total: number;
    quantity: number;
    title: string;
    faceValue?: number;
    createdAt: string;
    paidAt?: string;
    deliveredAt?: string;
    paymentMethod?: PaymentMethod;
    paymentRef?: string;
    transactionId?: string;
    /** True when a screenshot exists — never expose the storage path/URL to the client. */
    hasProof: boolean;
    proofSubmittedAt?: string;
    /** True when delivered codes exist — fetch via reveal API, never embed plaintext. */
    hasCodes: boolean;
    /** Voucher face value the buyer asked for (before the desk fee). */
    voucher: number;
    issuance?: IssuanceView;
  }>;
  audit: Audit[];
  totals: {
    orderCount: number;
    codeReady: number;
    codeHeld: number;
    codeSold: number;
    codeVoid: number;
  };
  ledger: Ledger;
};

export type LedgerFigures = {
  buyCount: number;
  /** What buyers paid the desk (voucher + fee). */
  buyGross: number;
  buyFee: number;
  issued: number;
  issuedFace: number;
  /** Charged to the iCash reseller balance, in the reseller currency. */
  icashCost: number;
  sellCount: number;
  sellFace: number;
  sellPayout: number;
  /** Desk income: buy fees + sell margin. */
  revenue: number;
};

export type LedgerDay = LedgerFigures & { date: string };

export type Ledger = {
  days: LedgerDay[];
  today: LedgerFigures;
  month: LedgerFigures;
  all: LedgerFigures;
  queue: {
    awaitingApproval: number;
    issuing: number;
    failed: number;
    openSells: number;
    openSellFace: number;
  };
};

export type BuyerOrder = {
  id: string;
  number: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  total: number;
  quantity: number;
  title: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  proofSubmittedAt?: string;
  codes: string[];
};
