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
  PENDING: "Payment is not confirmed yet.",
  PAID: "Payment is confirmed. The code is being prepared.",
  DELIVERED: "This code was decrypted for you on this page.",
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
      <Frame className="py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{order.number}</p>
        <h1 className="mt-4 display text-5xl sm:text-6xl">{order.title}</h1>
        <p className="mt-4 text-muted">
          {formatBdt(order.total)} · {formatWhen(order.createdAt)} · {order.status}
        </p>
        <p className="mt-6 max-w-lg text-lg leading-relaxed">{statusCopy[order.status]}</p>
        {order.status === "DELIVERED" ? (
          <div className="mt-10 grid max-w-xl gap-4">
            {order.codes.map((code) => (
              <CopyCode key={code} value={code} />
            ))}
          </div>
        ) : null}
        {order.status === "PENDING" && t ? (
          <div className="mt-10">
            <ButtonLink href={`/pay/${order.id}?t=${encodeURIComponent(t)}`}>Return to checkout</ButtonLink>
          </div>
        ) : null}
      </Frame>
    );
  } catch (error) {
    if (error instanceof DeskError) {
      return (
        <Frame className="py-24">
          <h1 className="display text-5xl">This link is not valid.</h1>
          <p className="mt-4 text-muted">Open the link from your checkout. It is signed for this order alone.</p>
        </Frame>
      );
    }
    throw error;
  }
}
