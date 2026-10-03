import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { Hero } from "@/components/hero";
import { Platforms } from "@/components/platforms";
import { Reveal } from "@/components/reveal";
import { VoucherShowcase } from "@/components/voucher-showcase";
import { faqs, steps } from "@/lib/content";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "iCash Exchange" },
  description: "Buy a digital note on iCash Exchange. Pay, then read the code on your order page.",
};

export default async function HomePage() {
  const products = await getPublicProducts();

  return (
    <>
      <Hero products={products} />
      <VoucherShowcase products={products} />
      <Platforms />
      <section className="border-t border-white/10">
        <Frame className="grid gap-12 py-20 md:grid-cols-3 md:py-28">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.08}>
              <p className="display text-4xl text-white/40">{step.number}</p>
              <h2 className="mt-4 display text-3xl leading-none">{step.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">{step.body}</p>
            </Reveal>
          ))}
        </Frame>
      </section>
      <section className="border-t border-white/10">
        <Frame className="py-20 md:py-28">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Questions</p>
          <h2 className="mt-4 display text-4xl leading-none sm:text-5xl">Before you pay</h2>
          <div className="mt-10 max-w-3xl">
            {faqs.map((item) => (
              <details key={item.q} className="group border-b border-white/10 py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-6 display text-2xl leading-tight">
                  {item.q}
                  <span className="text-white group-open:hidden">+</span>
                  <span className="hidden text-white group-open:inline">–</span>
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Frame>
      </section>
    </>
  );
}
