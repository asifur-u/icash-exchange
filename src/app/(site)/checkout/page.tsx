import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { CheckoutForm } from "@/components/checkout-form";
import { ButtonLink } from "@/components/ui/button-link";
import { formatBdt } from "@/lib/format";
import { getPublicProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>;
}) {
  const query = await searchParams;
  const product = query.product ? await getPublicProduct(query.product) : null;
  const requested = Number(query.qty ?? "1");
  const quantity = Number.isInteger(requested) ? Math.min(5, Math.max(1, requested)) : 1;

  return (
    <Frame className="grid gap-16 py-28 lg:grid-cols-2 lg:py-32">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Checkout</p>
        <h1 className="mt-4 display text-5xl">Where should the code go?</h1>
        {product && product.stock > 0 ? (
          <div className="mt-10">
            <CheckoutForm
              productSlug={product.slug}
              title={product.title}
              quantity={Math.min(quantity, product.stock)}
              total={product.price * Math.min(quantity, product.stock)}
            />
          </div>
        ) : (
          <div className="mt-10">
            <p className="text-muted">Choose a note that is still in stock.</p>
            <div className="mt-6">
              <ButtonLink href="/catalog">Open the catalog</ButtonLink>
            </div>
          </div>
        )}
      </div>
      <aside className="border border-white/10 p-8 lg:mt-16">
        {product ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{product.title}</p>
            <p className="mt-4 display text-5xl">{formatBdt(product.faceValue)}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{product.blurb}</p>
            <p className="mt-8 text-sm text-white/70">{product.stock} ready on the desk</p>
          </>
        ) : (
          <p className="display text-3xl">No note selected.</p>
        )}
      </aside>
    </Frame>
  );
}
