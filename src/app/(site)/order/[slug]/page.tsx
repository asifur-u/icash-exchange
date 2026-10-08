import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Frame } from "@/components/frame";
import { ProcessSteps } from "@/components/process-steps";
import { VoucherDesk } from "@/components/voucher-desk";
import { formatBdt } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getPublicProduct, getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Buy" };
  return { title: `Buy ${product.title}`, description: product.blurb };
}

export default async function OrderNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const [products, user] = await Promise.all([getPublicProducts(), getCurrentUser()]);

  return (
    <section className="bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-32">
      <Frame>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Buy</p>
        <h1 className="mt-4 display text-[clamp(2.6rem,10vw,5rem)]">
          {product.title}
          <span className="block accent-red">{formatBdt(product.faceValue)}</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Choose the quantity. The amount under You pay is what you send with bKash, Nagad, Rocket or bank.
        </p>

        <ProcessSteps current={2} />

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="premium-card rounded-[28px] p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">This note</p>
            <p className="mt-4 text-lg leading-relaxed text-white/70">{product.blurb}</p>
            <ul className="mt-8 space-y-4 text-base text-white/60">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2d2d]" />
                Held for one buyer while you pay.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2d2d]" />
                bKash, Nagad, Rocket or bank.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2d2d]" />
                Code shows on your order page after the desk confirms the deposit.
              </li>
            </ul>
            <p className="mt-8 text-sm text-white/40">
              {product.stock > 0 ? `${product.stock} ready on the desk` : "Sold out"}
            </p>
          </div>

          <VoucherDesk products={products} loggedIn={Boolean(user)} />
        </div>
      </Frame>
    </section>
  );
}
