import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/frame";
import { formatBdt } from "@/lib/format";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog",
  description: "iCash Exchange sample notes, priced in taka.",
};

export default async function CatalogPage() {
  const products = await getPublicProducts();

  return (
    <Frame className="py-20 sm:py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Catalog</p>
      <h1 className="mt-4 max-w-xl display text-[clamp(2.4rem,8vw,3.75rem)] leading-none sm:text-6xl">
        Notes on the desk.
      </h1>
      <p className="mt-6 max-w-lg text-base text-muted sm:text-lg">Four values in taka. Each code is held for one buyer.</p>
      <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/order/${product.slug}`}
            className="premium-card group rounded-[22px] p-5 transition hover:border-white/35 sm:rounded-[24px] sm:p-8"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
            </p>
            <h2 className="mt-6 display text-[clamp(2.4rem,10vw,3rem)] leading-none sm:mt-8 sm:text-5xl">
              {formatBdt(product.faceValue)}
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">{product.blurb}</p>
            <p className="mt-8 text-sm text-white sm:mt-10">Order this note</p>
          </Link>
        ))}
      </div>
    </Frame>
  );
}
