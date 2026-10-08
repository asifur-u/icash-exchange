import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Frame } from "@/components/frame";
import { ProcessSteps } from "@/components/process-steps";
import { VoucherDesk } from "@/components/voucher-desk";
import { getPublicProduct, getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Note" };
  return { title: product.title, description: product.blurb };
}

export default async function OrderNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const products = await getPublicProducts();
  const focused = products.filter((item) => item.slug === slug);

  return (
    <Frame className="py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Buy</p>
      <h1 className="mt-4 display text-5xl leading-none sm:text-6xl">{product.title}</h1>
      <p className="mt-5 max-w-xl text-lg text-white/60">
        Set how many codes you want. The amount under “You pay” is what you send on the next page.
      </p>
      <ProcessSteps current={2} />
      <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-start">
      <div>
        <p className="text-lg text-white/60">{product.blurb}</p>
        <ul className="mt-8 space-y-3 text-sm text-white/60">
          <li>Held for one buyer while you pay.</li>
          <li>bKash, Nagad, Rocket or bank.</li>
          <li>Code shows on your order page after the desk confirms the deposit.</li>
        </ul>
      </div>
      <VoucherDesk products={focused.length ? focused : [product]} />
      </div>
    </Frame>
  );
}
