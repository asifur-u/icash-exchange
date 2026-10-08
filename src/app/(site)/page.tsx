import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Platforms } from "@/components/platforms";
import { VoucherShowcase } from "@/components/voucher-showcase";
import { faqs, reasons } from "@/lib/content";
import { getCurrentUser } from "@/lib/session";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "iCash Exchange" },
  description: "Buy a digital note on iCash Exchange. Pay, then read the code on your order page.",
};

export default async function HomePage() {
  const [products, user] = await Promise.all([getPublicProducts(), getCurrentUser()]);

  return (
    <>
      <Hero products={products} loggedIn={Boolean(user)} />
      <VoucherShowcase products={products} />
      <Platforms />
      <section className="bg-black">
        <Frame className="py-16 sm:py-20 md:py-28">
          <p className="eyebrow">Why iCash</p>
          <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
            Built for <span className="accent-red">one code.</span>
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {reasons.map((reason) => (
              <div key={reason.title} className="premium-card rounded-[28px] p-7 sm:p-9">
                <h3 className="display-soft text-[1.7rem] leading-none">{reason.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-white/60">{reason.body}</p>
              </div>
            ))}
          </div>
        </Frame>
      </section>
      <HowItWorks />
      <section className="bg-black">
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
