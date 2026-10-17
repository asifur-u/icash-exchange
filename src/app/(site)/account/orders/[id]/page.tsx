import type { Metadata } from "next";
import Link from "next/link";
import { CopyCode } from "@/components/copy-code";
import { DeskError } from "@/lib/errors";
import { formatBdt, formatWhen } from "@/lib/format";
import { getOrderForBuyer } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

const statusCopy: Record<OrderStatus, string> = {
  PENDING: "Payment is not confirmed yet. Send the deposit and upload proof.",
  REVIEWING: "Your screenshot and TrxID are with the desk. The voucher unlocks after approval.",
  PAID: "Payment is confirmed. The code is being prepared.",
  DELIVERED: "Your voucher code is ready below. Keep this page private.",
  FAILED: "The hold ended before payment. The codes are back on the desk.",
  REFUNDED: "This order was refunded. A revealed code is void and is not sold again.",
};

const statusStyle: Record<OrderStatus, { bg: string; color: string }> = {
  PENDING: { bg: "#fff7ed", color: "#c2410c" },
  REVIEWING: { bg: "#eff6ff", color: "#1d4ed8" },
  PAID: { bg: "#ecfdf5", color: "#047857" },
  DELIVERED: { bg: "#ecfdf5", color: "#047857" },
  FAILED: { bg: "#fef2f2", color: "#b91c1c" },
  REFUNDED: { bg: "#f4f4f5", color: "#52525b" },
};

export default async function AccountOrderDetailPage({
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
    const tone = statusStyle[order.status];

    return (
      <div className="space-y-4" style={{ color: "#09090b" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/account/orders" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
            ← All orders
          </Link>
          <span
            className="inline-flex h-7 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ background: tone.bg, color: tone.color }}
          >
            {order.status}
          </span>
        </div>

        <article className="al-card overflow-hidden p-5 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {order.number}
          </p>
          <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-zinc-900">
            {order.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {formatBdt(order.total)} · {formatWhen(order.createdAt)}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {statusCopy[order.status]}
          </p>

          {order.transactionId ? (
            <div
              className="mt-6 rounded-2xl px-4 py-3 text-sm text-zinc-600"
              style={{ border: "1px solid #e4e4e7", background: "#fafafa" }}
            >
              <p>
                Method · <span className="font-semibold text-zinc-900">{order.paymentMethod ?? "—"}</span>
              </p>
              <p className="mt-1 font-mono">
                TrxID · <span className="font-semibold text-zinc-900">{order.transactionId}</span>
              </p>
            </div>
          ) : null}

          {order.status === "DELIVERED" ? (
            <div className="mt-8 grid gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Your voucher
              </p>
              {order.codes.map((code) => (
                <CopyCode key={code} value={code} title={`${order.title} · ${formatBdt(order.total)}`} />
              ))}
            </div>
          ) : null}

          {order.status === "PENDING" && t ? (
            <div className="mt-8">
              <Link
                href={`/account/pay/${order.id}?t=${encodeURIComponent(t)}`}
                className="al-btn al-btn-primary inline-flex"
              >
                Continue to deposit
              </Link>
            </div>
          ) : null}

          {order.status === "REVIEWING" ? (
            <p className="mt-8 text-sm leading-relaxed text-zinc-500">
              Stay on this page or reopen it from Orders. When the desk confirms, refresh — the code
              appears here{order.email ? ` and can be emailed to ${order.email}` : ""}.
            </p>
          ) : null}
        </article>
      </div>
    );
  } catch (error) {
    if (error instanceof DeskError) {
      return (
        <div className="al-card p-6 sm:p-8" style={{ color: "#09090b" }}>
          <h1 className="text-2xl font-extrabold text-zinc-900">This link is not valid.</h1>
          <p className="mt-2 text-sm text-zinc-500">Open the order from your Orders list.</p>
          <Link href="/account/orders" className="al-btn al-btn-ghost mt-5 inline-flex">
            View orders
          </Link>
        </div>
      );
    }
    throw error;
  }
}
