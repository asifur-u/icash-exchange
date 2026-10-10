"use client";

import Link from "next/link";
import { formatBdt } from "@/lib/format";

type ServiceProduct = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  faceValue: number;
  price: number;
  stock: number;
};

const steps = [
  { n: "01", title: "Pick a note", body: "Choose the face value you need." },
  { n: "02", title: "Send deposit", body: "Pay with bKash, Nagad, Rocket or bank." },
  { n: "03", title: "Desk review", body: "Owner matches your TrxID + screenshot." },
  { n: "04", title: "Read code", body: "Open the order and copy your voucher." },
];

export function AccountServices({ products }: { products: ServiceProduct[] }) {
  return (
    <div className="space-y-5">
      <header className="rounded-[28px] border border-white/12 bg-[#0a0a0a] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Services</p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
          Notes on the desk.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          Pick a value, reserve it, then send the deposit. Your order stays under Orders.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => {
          const available = product.stock > 0;
          return (
            <Link
              key={product.id}
              href={available ? `/order/${product.slug}` : "/account/services"}
              aria-disabled={!available}
              className={`group relative overflow-hidden rounded-[26px] border border-white/12 bg-[#0c0c0c] p-5 transition sm:p-6 ${
                available ? "hover:border-white/30" : "pointer-events-none opacity-50"
              }`}
            >
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1.5 bg-[#ff2d2d] opacity-80"
              />
              <p className="pl-2 text-[11px] uppercase tracking-[0.16em] text-white/40">
                {available ? `${product.stock} ready` : "Sold out"}
              </p>
              <p className="mt-4 pl-2 display text-[clamp(2.2rem,6vw,3rem)] leading-none">
                {formatBdt(product.faceValue)}
              </p>
              <p className="mt-2 pl-2 text-sm text-white/50">{product.blurb}</p>
              <p className="mt-6 ml-2 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition group-hover:bg-white/90">
                {available ? "Buy this note" : "Unavailable"}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-white/12 bg-[#0a0a0a] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">How it works</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="rounded-2xl bg-white/[0.03] px-4 py-4">
              <p className="text-xs font-semibold text-[#ff2d2d]">{step.n}</p>
              <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
