import type { Metadata } from "next";
import Image from "next/image";
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
  const qty = product ? Math.min(quantity, product.stock) : quantity;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[min(100vw,640px)] -translate-x-1/2 rounded-full bg-white/[0.035] blur-[110px]"
      />
      <Frame className="relative grid items-start gap-6 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="premium-card rounded-[28px] p-5 sm:rounded-[40px] sm:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Checkout</p>
          <h1 className="mt-4 display text-[clamp(2rem,7vw,3rem)] sm:text-5xl">Where should the code go?</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/50 sm:text-lg">
            Add your email and mobile. Then send the deposit and upload proof on the next page.
          </p>
          {product && product.stock > 0 ? (
            <div className="mt-10">
              <CheckoutForm
                productSlug={product.slug}
                title={product.title}
                quantity={qty}
                total={product.price * qty}
              />
            </div>
          ) : (
            <div className="mt-10">
              <p className="text-white/55">Choose a note that is still in stock.</p>
              <div className="mt-6">
                <ButtonLink href="/catalog">Open the catalog</ButtonLink>
              </div>
            </div>
          )}
        </div>

        <aside className="premium-card rounded-[28px] p-5 sm:rounded-[40px] sm:p-10 lg:sticky lg:top-28">
          {product ? (
            <>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">{product.title}</p>
              <p className="mt-5 display text-[clamp(2.4rem,10vw,3.75rem)] sm:text-6xl">{formatBdt(product.faceValue)}</p>
              <p className="mt-5 text-base leading-relaxed text-white/50">{product.blurb}</p>
              <div className="mt-8 space-y-3 text-sm text-white/55">
                <p>Quantity · {qty}</p>
                <p>Total · <span className="font-medium text-white">{formatBdt(product.price * qty)}</span></p>
                <p>{product.stock} ready on the desk</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "bKash", logo: "/payments/bkash.png" },
                  { label: "Nagad", logo: "/payments/nagad.png" },
                  { label: "Rocket", logo: "/payments/rocket.png" },
                  { label: "Bank", logo: "/payments/bank.png" },
                ].map((method) => (
                  <span
                    key={method.label}
                    title={method.label}
                    className="relative block h-8 w-8 overflow-hidden rounded-xl border border-white/15 bg-white p-0.5"
                  >
                    <Image
                      src={method.logo}
                      alt={method.label}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="display text-3xl">No note selected.</p>
          )}
        </aside>
      </Frame>
    </section>
  );
}
