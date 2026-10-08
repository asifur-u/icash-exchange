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
        <Frame className="py-16 sm:py-20 md:py-28">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
            Three steps.
            <span className="block accent-red">One code.</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.08}>
                <div className="premium-card h-full rounded-[28px] p-7 sm:p-9">
                  <p className="text-sm font-semibold tracking-tight text-[#ff2d2d]">{step.number}</p>
                  <h3 className="mt-6 display-soft text-[1.7rem] leading-none sm:text-[2rem]">{step.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-white/60">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Frame>
      </section>
      <section className="border-t border-white/10">
        <Frame className="py-16 sm:py-20 md:py-28">
          <p className="eyebrow">Questions</p>
          <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
            Before <span className="accent-red">you pay</span>
          </h2>
          <div className="mt-8 max-w-3xl sm:mt-10">
            {faqs.map((item) => (
              <details key={item.q} className="group border-b border-white/10 py-4 sm:py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 display-soft text-xl sm:items-center sm:gap-6 sm:text-2xl">
                  <span className="min-w-0">{item.q}</span>
                  <span className="shrink-0 text-white group-open:hidden">+</span>
                  <span className="hidden shrink-0 text-white group-open:inline">–</span>
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
