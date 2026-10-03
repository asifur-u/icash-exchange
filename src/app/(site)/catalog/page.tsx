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
    <Frame className="py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Catalog</p>
      <h1 className="mt-4 max-w-xl display text-5xl leading-none sm:text-6xl">Notes on the desk.</h1>
      <p className="mt-6 max-w-lg text-lg text-muted">Four sample values. Each code is held for one buyer.</p>
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/order/${product.slug}`}
            className="premium-card group rounded-[24px] p-6 transition hover:border-white/35 sm:p-8"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
            </p>
            <h2 className="mt-8 display text-5xl leading-none">{formatBdt(product.faceValue)}</h2>
            <p className="mt-3 text-muted">{product.blurb}</p>
            <p className="mt-10 text-sm text-white">Order this note</p>
          </Link>
        ))}
      </div>
    </Frame>
  );
}
