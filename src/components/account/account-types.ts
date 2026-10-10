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
  if (status === "DELIVERED") return "border-[#9fe870]/40 bg-[#9fe870]/10 text-[#9fe870]";
  if (status === "REVIEWING") return "border-amber-200/30 bg-amber-200/10 text-amber-100";
  if (status === "PENDING") return "border-white/20 bg-white/5 text-white/75";
  if (status === "FAILED" || status === "REFUNDED") return "border-red-300/30 bg-red-400/10 text-red-200";
  return "border-white/20 text-white/80";
}
