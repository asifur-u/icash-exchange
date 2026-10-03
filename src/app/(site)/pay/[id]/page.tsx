import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Frame } from "@/components/frame";
import { PayPanel } from "@/components/pay-panel";
import { ButtonLink } from "@/components/ui/button-link";
import { DeskError } from "@/lib/errors";
import { getOrderForBuyer } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay",
  robots: { index: false, follow: false },
};

export default async function PayPage({
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
    if (order.status === "DELIVERED" && t) redirect(`/orders/${id}?t=${encodeURIComponent(t)}`);
    if (order.status === "FAILED" || order.status === "REFUNDED") {
      return (
        <Frame className="py-24">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Checkout</p>
          <h1 className="mt-4 display text-5xl">This hold has ended.</h1>
          <p className="mt-4 max-w-md text-muted">Start again from the catalog. Unpaid codes return to the desk.</p>
          <div className="mt-8">
            <ButtonLink href="/catalog">Back to the catalog</ButtonLink>
          </div>
        </Frame>
      );
    }
    if (!t) throw new DeskError("UNAUTHORIZED", "This link is not valid.");
    return (
      <Frame className="py-16 md:py-24">
        <PayPanel
          orderId={order.id}
          token={t}
          number={order.number}
          email={order.email}
          total={order.total}
          title={order.title}
        />
      </Frame>
    );
  } catch (error) {
    if (error instanceof DeskError) {
      return (
        <Frame className="py-24">
          <h1 className="display text-5xl">This link is not valid.</h1>
        </Frame>
      );
    }
    throw error;
  }
}
