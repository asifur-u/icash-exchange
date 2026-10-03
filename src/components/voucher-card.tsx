"use client";

import { useRef } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { formatBdt } from "@/lib/format";

export function VoucherCard({
  faceValue,
  title,
  large = false,
}: {
  faceValue: number;
  title: string;
  large?: boolean;
}) {
  const card = useRef<HTMLElement>(null);

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = card.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 16}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 20}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function onLeave() {
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--rx", "10deg");
    el.style.setProperty("--ry", "-16deg");
    el.style.setProperty("--mx", "28%");
    el.style.setProperty("--my", "16%");
  }

  return (
    <div className={`relative mx-auto w-full ${large ? "max-w-[560px]" : "max-w-[440px]"}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 -bottom-6 h-24 rounded-full bg-white/15 blur-3xl"
      />
      <div className="voucher-stage float-soft" onPointerMove={onMove} onPointerLeave={onLeave}>
        <article
          ref={card}
          aria-label={`${title}, ${formatBdt(faceValue)}`}
          className="voucher-card relative aspect-[1.62/1] w-full overflow-hidden rounded-[26px]"
        >
          <div className="voucher-sheen" />
          <div className="pointer-events-none absolute inset-[11px] border border-accent/30" />
          <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <BrandLogo size="sm" />
                <p className="mt-1.5 text-[10px] tracking-[0.22em] text-white/45">DHAKA</p>
              </div>
              <div className="metal-chip" aria-hidden="true" />
            </div>
            <div>
              <p className="display text-[clamp(2.4rem,6vw,3.8rem)] text-white">{formatBdt(faceValue)}</p>
              <p className="mt-3 text-[10px] tracking-[0.22em] text-white/55">{title.toUpperCase()}</p>
            </div>
            <div className="flex items-end justify-between text-[10px] tracking-[0.2em] text-white/55">
              <span>DIGITAL NOTE</span>
              <span className="font-mono">SECURE</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
