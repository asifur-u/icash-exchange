import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PayPanel } from "@/components/pay-panel";
import { DeskError } from "@/lib/errors";
import { getOrderForBuyer } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deposit",
  robots: { index: false, follow: false },
};

export default async function AccountPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  try {
    const order = await getOrderForBuyer(id, t);
    if ((order.status === "DELIVERED" || order.status === "REVIEWING" || order.status === "PAID") && t) {
      redirect(`/account/orders/${id}?t=${encodeURIComponent(t)}`);
    }
    if (order.status === "FAILED" || order.status === "REFUNDED") {
      return (
        <div className="al-card p-6 sm:p-8" style={{ color: "#09090b" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
            Checkout
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-zinc-900">This hold has ended.</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Start again from your desk notes. Unpaid codes return to stock.
          </p>
          <Link href="/account/services" className="al-btn al-btn-primary mt-6 inline-flex">
            Back to notes
          </Link>
        </div>
      );
    }
    if (!t) throw new DeskError("UNAUTHORIZED", "This link is not valid.");

    return (
      <div className="space-y-4" style={{ color: "#09090b" }}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-3 py-1">1 · Buy</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">2 · Checkout</span>
          <span className="rounded-full bg-[#fff5f5] px-3 py-1 text-[#e11d2e]">3 · Deposit</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">4 · Code</span>
        </div>
        <PayPanel
          orderId={order.id}
          token={t}
          number={order.number}
          email={order.email}
          phone={order.phone}
          total={order.total}
          title={order.title}
          tone="portal"
        />
      </div>
    );
  } catch (error) {
    if (error instanceof DeskError) {
      return (
        <div className="al-card p-6 sm:p-8" style={{ color: "#09090b" }}>
          <h1 className="text-2xl font-extrabold text-zinc-900">This link is not valid.</h1>
          <Link href="/account/orders" className="al-btn al-btn-ghost mt-5 inline-flex">
            View orders
          </Link>
        </div>
      );
    }
    throw error;
  }
}
