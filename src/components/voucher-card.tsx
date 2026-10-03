"use client";

import { useRef } from "react";
import Image from "next/image";
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
  const serial = `IC-${String(faceValue).padStart(4, "0")}-••••-8842`;

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = card.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 12}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 16}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function onLeave() {
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--rx", "8deg");
    el.style.setProperty("--ry", "-14deg");
    el.style.setProperty("--mx", "30%");
    el.style.setProperty("--my", "18%");
  }

  return (
    <div className={`relative mx-auto w-full ${large ? "max-w-[620px]" : "max-w-[480px]"}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 -bottom-8 h-24 rounded-full bg-white/20 blur-3xl sm:-bottom-10 sm:h-32 sm:bg-white/25"
      />
      <div className="voucher-stage float-soft" onPointerMove={onMove} onPointerLeave={onLeave}>
        <article
          ref={card}
          aria-label={`iCash ${title}, ${formatBdt(faceValue)}`}
          className="voucher-card relative w-full overflow-hidden rounded-[20px] sm:aspect-[1.586/1] sm:rounded-[26px]"
        >
          <div className="voucher-pattern" aria-hidden="true" />
          <div className="voucher-sheen" />
          <div className="voucher-holo" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-[8px] rounded-[14px] border border-white/25 sm:inset-[12px] sm:rounded-[18px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#ff2d2d] via-[#ff2d2d]/80 to-transparent" />

          <div className="relative flex h-full flex-col justify-between gap-3 p-4 sm:gap-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Image
                  src="/icash-clean.png"
                  alt="iCash Exchange"
                  width={220}
                  height={110}
                  unoptimized
                  className="h-7 w-auto object-contain object-left sm:h-11"
                />
                <p className="mt-1.5 text-[9px] font-medium tracking-[0.22em] text-white/50 sm:mt-2 sm:text-[10px] sm:tracking-[0.28em]">
                  GIFT VOUCHER
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-2 sm:gap-3">
                <div className="metal-chip" aria-hidden="true" />
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="mt-1 h-5 w-5 text-white/55 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M8 8c2.5-2.5 5.5-2.5 8 0" />
                  <path d="M10 10.5c1.5-1.5 3.5-1.5 5 0" />
                  <circle cx="15.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-[9px] tracking-[0.2em] text-white/45 sm:text-[10px] sm:tracking-[0.24em]">
                FACE VALUE
              </p>
              <p className="mt-1 display text-[clamp(2rem,9vw,4.2rem)] leading-none text-white">
                {formatBdt(faceValue)}
              </p>
              <p className="mt-1.5 text-sm font-medium tracking-tight text-white/70 sm:mt-2">{title}</p>
            </div>

            <div className="voucher-card-footer flex items-end justify-between gap-3 border-t border-white/15 pt-2.5 sm:pt-3">
              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.2em] text-white/40">VOUCHER NO.</p>
                <p className="mt-1 break-all font-mono text-[10px] tracking-[0.08em] text-white/75 sm:text-xs sm:tracking-[0.14em]">
                  {serial}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] tracking-[0.2em] text-white/40">STATUS</p>
                <p className="mt-1 text-[11px] font-medium tracking-[0.18em] text-white/80">SECURE</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
