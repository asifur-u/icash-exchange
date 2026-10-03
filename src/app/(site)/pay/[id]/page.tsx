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
    if ((order.status === "DELIVERED" || order.status === "REVIEWING" || order.status === "PAID") && t) {
      redirect(`/orders/${id}?t=${encodeURIComponent(t)}`);
    }
    if (order.status === "FAILED" || order.status === "REFUNDED") {
      return (
        <Frame className="py-24">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Checkout</p>
          <h1 className="mt-4 display text-5xl">This hold has ended.</h1>
          <p className="mt-4 max-w-md text-white/55">Start again from the catalog. Unpaid codes return to the desk.</p>
          <div className="mt-8">
            <ButtonLink href="/catalog">Back to the catalog</ButtonLink>
          </div>
        </Frame>
      );
    }
    if (!t) throw new DeskError("UNAUTHORIZED", "This link is not valid.");
    return (
      <section className="relative overflow-hidden py-14 sm:py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[min(100vw,720px)] -translate-x-1/2 rounded-full bg-white/[0.035] blur-[110px] sm:h-[420px]"
        />
        <Frame className="relative">
          <PayPanel
            orderId={order.id}
            token={t}
            number={order.number}
            email={order.email}
            phone={order.phone}
            total={order.total}
            title={order.title}
          />
        </Frame>
      </section>
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
