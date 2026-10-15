export type AccountOrder = {
  id: string;
  number: string;
  status: string;
  total: number;
  title: string;
  createdAt: string;
  paymentMethod?: string;
  transactionId?: string;
  proofSubmittedAt?: string;
  deliveredAt?: string;
  token: string;
};

export function statusTone(status: string) {
  if (status === "DELIVERED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "REVIEWING") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "PENDING") return "border-zinc-200 bg-zinc-50 text-zinc-600";
  if (status === "FAILED" || status === "REFUNDED") return "border-red-200 bg-red-50 text-red-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}
