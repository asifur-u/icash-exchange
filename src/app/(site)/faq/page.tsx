import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How iCash Exchange reserves, delivers, and protects a voucher code.",
};

export default function FaqPage() {
  return (
    <Frame className="py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">FAQ</p>
      <h1 className="mt-4 display text-5xl sm:text-6xl">The desk, plainly.</h1>
      <div className="mt-12 max-w-3xl">
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
  );
}
