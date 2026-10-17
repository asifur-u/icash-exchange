import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { deskBreakdown } from "@/lib/desk-fee";
import { formatBdt } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getPublicProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function AccountCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>;
}) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    const resume = `/account/checkout?product=${query.product ?? ""}&qty=${query.qty ?? "1"}`;
    redirect(
      `/auth?next=${encodeURIComponent("/account")}&resume=${encodeURIComponent(resume)}`,
    );
  }

  const product = query.product ? await getPublicProduct(query.product) : null;
  const requested = Number(query.qty ?? "1");
  const quantity = Number.isInteger(requested) ? Math.min(5, Math.max(1, requested)) : 1;
  const qty = product ? Math.min(quantity, product.stock) : quantity;
  const fees = product ? deskBreakdown(product.price * qty) : null;

  return (
    <div className="space-y-5" style={{ color: "#09090b" }}>
      <header className="al-card p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
          Checkout
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-zinc-900">
          Confirm and deposit
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
          Review the note total, then continue to deposit — all inside your portal.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-3 py-1">1 · Buy</span>
          <span className="rounded-full bg-[#fff5f5] px-3 py-1 text-[#e11d2e]">2 · Checkout</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">3 · Deposit</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">4 · Code</span>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
        <div className="al-card p-5 sm:p-7">
          {product && product.stock > 0 && fees ? (
            <CheckoutForm
              productSlug={product.slug}
              title={product.title}
              quantity={qty}
              voucher={fees.voucher}
              fee={fees.fee}
              total={fees.total}
              signedInAs={user.email}
              tone="portal"
            />
          ) : (
            <div>
              <p className="text-sm text-zinc-600">Choose a note that is still in stock.</p>
              <Link
                href="/account/services"
                className="al-btn al-btn-primary mt-5 inline-flex"
              >
                Open desk notes
              </Link>
            </div>
          )}
        </div>

        <aside className="al-card p-5 sm:p-6 lg:sticky lg:top-6">
          {product && fees ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {product.title}
              </p>
              <p className="mt-3 text-[clamp(2rem,5vw,2.8rem)] font-extrabold tabular-nums text-zinc-900">
                {formatBdt(product.faceValue)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{product.blurb}</p>
              <div className="mt-5 space-y-2 text-sm text-zinc-600">
                <p>Quantity · {qty}</p>
                <p>
                  Voucher ·{" "}
                  <span className="font-semibold text-zinc-900">{formatBdt(fees.voucher)}</span>
                </p>
                <p>
                  Desk fee 2.5% ·{" "}
                  <span className="font-semibold text-zinc-900">{formatBdt(fees.fee)}</span>
                </p>
                <p>
                  Total ·{" "}
                  <span className="font-semibold text-zinc-900">{formatBdt(fees.total)}</span>
                </p>
                <p>{product.stock} ready on the desk</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: "bKash", logo: "/payments/bkash.png" },
                  { label: "Nagad", logo: "/payments/nagad.png" },
                  { label: "Rocket", logo: "/payments/rocket.png" },
                  { label: "Bank", logo: "/payments/bank.png" },
                ].map((method) => (
                  <span
                    key={method.label}
                    title={method.label}
                    className="relative block h-9 w-9 overflow-hidden rounded-xl border border-zinc-200 bg-white p-0.5"
                  >
                    <Image
                      src={method.logo}
                      alt={method.label}
                      width={36}
                      height={36}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-lg font-bold text-zinc-900">No note selected.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
