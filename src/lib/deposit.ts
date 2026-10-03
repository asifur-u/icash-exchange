export const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", hint: "Send Money", logo: "/payments/bkash.png" },
  { id: "nagad", label: "Nagad", hint: "Send Money", logo: "/payments/nagad.png" },
  { id: "rocket", label: "Rocket", hint: "Send Money", logo: "/payments/rocket.png" },
  { id: "bank", label: "Bank transfer", hint: "NPSB / BEFTN", logo: "/payments/bank.png" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export type DepositAccount = {
  id: PaymentMethodId;
  label: string;
  hint: string;
  logo: string;
  number: string;
  name: string;
  note?: string;
};

export function depositAccounts(): DepositAccount[] {
  return [
    {
      id: "bkash",
      label: "bKash",
      hint: "Send Money",
      logo: "/payments/bkash.png",
      number: process.env.DEPOSIT_BKASH ?? "01700000000",
      name: process.env.DEPOSIT_BKASH_NAME ?? "iCash Exchange",
      note: "Use Send Money. Keep the TrxID.",
    },
    {
      id: "nagad",
      label: "Nagad",
      hint: "Send Money",
      logo: "/payments/nagad.png",
      number: process.env.DEPOSIT_NAGAD ?? "01800000000",
      name: process.env.DEPOSIT_NAGAD_NAME ?? "iCash Exchange",
      note: "Use Send Money. Keep the TrxID.",
    },
    {
      id: "rocket",
      label: "Rocket",
      hint: "Send Money",
      logo: "/payments/rocket.png",
      number: process.env.DEPOSIT_ROCKET ?? "01900000000",
      name: process.env.DEPOSIT_ROCKET_NAME ?? "iCash Exchange",
      note: "Use Send Money. Keep the TrxID.",
    },
    {
      id: "bank",
      label: "Bank transfer",
      hint: process.env.DEPOSIT_BANK_NAME ?? "Dutch-Bangla Bank",
      logo: "/payments/bank.png",
      number: process.env.DEPOSIT_BANK_ACCOUNT ?? "1234567890",
      name: process.env.DEPOSIT_BANK_ACCOUNT_NAME ?? "iCash Exchange",
      note: process.env.DEPOSIT_BANK_BRANCH ?? "Upload the transfer slip screenshot.",
    },
  ];
}

export function depositAccount(id: PaymentMethodId) {
  return depositAccounts().find((item) => item.id === id);
}
