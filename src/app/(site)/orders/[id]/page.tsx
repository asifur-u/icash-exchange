import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { CopyCode } from "@/components/copy-code";
import { ButtonLink } from "@/components/ui/button-link";
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

export default async function BuyerOrderPage({
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
    return (
      <section className="relative overflow-hidden py-14 sm:py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-8%] top-16 h-[280px] w-[280px] rounded-full bg-white/[0.035] blur-[100px] sm:h-[380px] sm:w-[380px]"
        />
        <Frame className="relative max-w-3xl">
          <div className="premium-card rounded-[28px] p-5 sm:rounded-[40px] sm:p-12">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">{order.number}</p>
            <h1 className="mt-4 display text-[clamp(2.2rem,8vw,3.75rem)] sm:text-6xl">{order.title}</h1>
            <p className="mt-4 text-sm text-white/55 sm:text-base">
              {formatBdt(order.total)} · {formatWhen(order.createdAt)} · {order.status}
            </p>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">{statusCopy[order.status]}</p>

            {order.transactionId ? (
              <div className="mt-8 rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4 text-sm text-white/60">
                <p>
                  Method · <span className="text-white">{order.paymentMethod ?? "—"}</span>
                </p>
                <p className="mt-2 font-mono">
                  TrxID · <span className="text-white">{order.transactionId}</span>
                </p>
              </div>
            ) : null}

            {order.status === "DELIVERED" ? (
              <div className="mt-10 grid gap-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Your voucher</p>
                {order.codes.map((code) => (
                  <CopyCode key={code} value={code} title={`${order.title} · ${formatBdt(order.total)}`} />
                ))}
              </div>
            ) : null}

            {order.status === "PENDING" && t ? (
              <div className="mt-10">
                <ButtonLink href={`/pay/${order.id}?t=${encodeURIComponent(t)}`}>Continue to deposit</ButtonLink>
              </div>
            ) : null}

            {order.status === "REVIEWING" ? (
              <p className="mt-10 text-sm leading-relaxed text-white/45">
                Bookmark this link. When the owner confirms, refresh and the code appears here. It can also be emailed to{" "}
                {order.email}.
              </p>
            ) : null}
          </div>
        </Frame>
      </section>
    );
  } catch (error) {
    if (error instanceof DeskError) {
      return (
        <Frame className="py-24">
          <h1 className="display text-5xl">This link is not valid.</h1>
          <p className="mt-4 text-white/55">Open the link from your checkout. It is signed for this order alone.</p>
        </Frame>
      );
    }
    throw error;
  }
}
