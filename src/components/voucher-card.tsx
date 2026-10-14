"use client";

import { useRef } from "react";
import Image from "next/image";
import { formatBdt } from "@/lib/format";

/** Contactless arcs — same language as Visa / Mastercard metal cards */
function ContactlessIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="none">
      <path
        d="M10 11c4.2-4 9.8-4 14 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12.4 14.6c2.8-2.6 6.4-2.6 9.2 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14.8 18.2c1.4-1.3 3.2-1.3 4.6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="17.1" cy="21.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

/**
 * Custom network mark — Mastercard-style dual orb language,
 * iCash colours (titanium + brand red). Not a trademark copy.
 */
function NetworkMark() {
  return (
    <div className="card-network" aria-label="iCash network">
      <span className="card-network-orb card-network-orb-a" />
      <span className="card-network-orb card-network-orb-b" />
    </div>
  );
}

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
  const last4 = String(1000 + (faceValue % 9000)).padStart(4, "0");
  const pan = `5284  ••••  ••••  ${last4}`;

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = card.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function onLeave() {
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--rx", "6deg");
    el.style.setProperty("--ry", "-10deg");
    el.style.setProperty("--mx", "22%");
    el.style.setProperty("--my", "18%");
  }

  return (
    <div className={`relative mx-auto w-full ${large ? "max-w-[660px]" : "max-w-[520px]"}`}>
      {/* Soft ground shadow like a real metal card on glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] -bottom-[7%] h-[22%] rounded-[100%] bg-black/80 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[14%] -bottom-[4%] h-[14%] rounded-[100%] bg-white/20 blur-xl"
      />

      <div className="voucher-stage float-soft" onPointerMove={onMove} onPointerLeave={onLeave}>
        <article
          ref={card}
          aria-label={`iCash ${title}, ${formatBdt(faceValue)}`}
          className="voucher-card relative aspect-[1.586/1] w-full overflow-hidden rounded-[14px] sm:rounded-[18px]"
        >
          {/* Titanium layers — Apple Card / Amex Platinum DNA */}
          <div className="voucher-titanium" aria-hidden="true" />
          <div className="voucher-grain" aria-hidden="true" />
          <div className="voucher-sheen" aria-hidden="true" />
          <div className="voucher-bevel" aria-hidden="true" />
          <div className="voucher-glint" aria-hidden="true" />

          <div className="relative flex h-full flex-col px-[5.2%] py-[4.8%]">
            {/* Row 1 — brand (Apple-quiet) + laser mark */}
            <div className="flex items-start justify-between">
              <Image
                src="/icash-clean.png"
                alt="iCash Exchange"
                width={200}
                height={100}
                unoptimized
                className="h-[1.35rem] w-auto object-contain object-left opacity-95 sm:h-8"
              />
              <p className="pt-0.5 text-[8px] font-medium uppercase tracking-[0.34em] text-white/40 sm:text-[9px]">
                Titanium
              </p>
            </div>

            {/* Row 2 — EMV chip LEFT + contactless (real Visa/MC anatomy) */}
            <div className="mt-[6.5%] flex items-center gap-3 sm:mt-[7.5%] sm:gap-4">
              <div className="metal-chip" aria-hidden="true">
                <span className="metal-chip-grid">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <ContactlessIcon className="h-6 w-6 text-white/75 sm:h-7 sm:w-7" />
            </div>

            {/* Row 3 — face value as hero (Apple numberless spirit → value is the hero) */}
            <div className="mt-[5%] min-w-0 sm:mt-[6%]">
              <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-white/38 sm:text-[9px]">
                Face value
              </p>
              <p className="card-emboss display mt-0.5 text-[clamp(1.55rem,6.8vw,3.35rem)] leading-[0.92] text-white">
                {formatBdt(faceValue)}
              </p>
              <p className="card-pan mt-2 font-mono text-[clamp(0.68rem,2.35vw,0.98rem)] tracking-[0.2em] text-white/80 sm:mt-2.5 sm:tracking-[0.26em]">
                {pan}
              </p>
            </div>

            {/* Row 4 — holder / thru / network (Amex / Sapphire footer) */}
            <div className="mt-auto flex items-end justify-between gap-3 pt-2">
              <div className="min-w-0">
                <div className="flex items-end gap-5 sm:gap-8">
                  <div className="min-w-0">
                    <p className="text-[7px] font-medium uppercase tracking-[0.24em] text-white/35 sm:text-[8px]">
                      Cardholder
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/92 sm:text-[12px]">
                      iCash Member
                    </p>
                  </div>
                  <div className="shrink-0">
                    <p className="text-[7px] font-medium uppercase tracking-[0.24em] text-white/35 sm:text-[8px]">
                      Thru
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-white/85 sm:text-[12px]">
                      12/30
                    </p>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-[9px] tracking-[0.04em] text-white/40 sm:text-[10px]">
                  {title}
                </p>
              </div>
              <NetworkMark />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
