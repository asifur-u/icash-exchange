import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How iCash Exchange reserves, delivers, and protects a voucher code.",
};

export default function FaqPage() {
  return (
    <Frame className="py-20 sm:py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">FAQ</p>
      <h1 className="mt-4 display text-[clamp(2.4rem,8vw,3.75rem)] sm:text-6xl">The desk, plainly.</h1>
      <div className="mt-8 max-w-3xl sm:mt-12">
        {faqs.map((item) => (
          <details key={item.q} className="group border-b border-white/10 py-4 sm:py-5">
            <summary className="flex cursor-pointer items-start justify-between gap-4 display text-xl leading-tight sm:items-center sm:gap-6 sm:text-2xl">
              <span className="min-w-0">{item.q}</span>
              <span className="shrink-0 text-white group-open:hidden">+</span>
              <span className="hidden shrink-0 text-white group-open:inline">–</span>
            </summary>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </Frame>
  );
}
