"use client";

import { motion, useReducedMotion } from "motion/react";
import { useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";
import { TOKEN_PACKS, type TokenPack } from "@/lib/token-packs";

function CoinStack({ featured = false }: { featured?: boolean }) {
  return (
    <span aria-hidden="true" className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
      <span className="absolute left-2 top-0.5 h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/15 sm:h-9 sm:w-9" />
      <span className="absolute left-1 top-2 h-8 w-8 rounded-full bg-white/[0.16] ring-1 ring-white/20 sm:h-9 sm:w-9" />
      <span
        className={`absolute left-0 top-3.5 h-9 w-9 rounded-full bg-[linear-gradient(160deg,#f7f7f7_0%,#cfcfcf_45%,#f3f3f3_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.35)] ring-1 ring-white/50 sm:h-10 sm:w-10 ${
          featured ? "shadow-[0_10px_24px_rgba(255,255,255,0.18)]" : ""
        }`}
      >
        <span className="absolute inset-[2px] rounded-full ring-1 ring-black/10" />
      </span>
    </span>
  );
}

export function TokenPacks({
  selectedTokens,
  onPick,
}: {
  selectedTokens: number | null;
  onPick: (pack: TokenPack) => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="token-packs-title" className="relative">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{t("tokenPacks.eyebrow")}</p>
          <h2 id="token-packs-title" className="mt-2 text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.15rem]">
            {t("tokenPacks.title")}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/45 sm:text-[15px]">{t("tokenPacks.lead")}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {TOKEN_PACKS.map((pack, index) => {
          const selected = selectedTokens === pack.tokens;
          const featured = pack.tokens === 540;
          return (
            <motion.button
              key={pack.tokens}
              type="button"
              onClick={() => onPick(pack)}
              initial={reduce ? false : { y: 18 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.05 }}
              aria-pressed={selected}
              className={`group relative min-h-[13.75rem] overflow-hidden rounded-[28px] border p-5 text-left transition duration-200 sm:min-h-[16.5rem] sm:rounded-[32px] sm:p-6 lg:min-h-[17.5rem] ${
                selected
                  ? "border-white bg-white text-black shadow-[0_28px_70px_rgba(255,255,255,0.14)]"
                  : "border-white/12 bg-[#0c0c0c] text-white shadow-[0_22px_50px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-white/35 hover:bg-[#111]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl ${
                  selected ? "bg-black/10" : "bg-white/[0.07]"
                }`}
              />
              <span className="relative flex items-start justify-between gap-2">
                <CoinStack featured={featured} />
                {featured ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      selected ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    {t("tokenPacks.best")}
                  </span>
                ) : null}
              </span>
              <p
                className={`relative mt-5 text-[1.35rem] font-extrabold leading-none tracking-tight sm:text-[1.6rem] md:text-[1.85rem] ${
                  selected ? "text-black" : "text-white"
                }`}
              >
                {formatBdt(pack.price)}
              </p>
              <p className={`relative mt-3 flex items-baseline gap-1.5 ${selected ? "text-black" : "text-white"}`}>
                <span className="text-[2rem] font-extrabold leading-none tracking-tight sm:text-[2.35rem] md:text-[2.6rem]">
                  {pack.tokens}
                </span>
                <span className={`text-sm font-semibold sm:text-base ${selected ? "text-black/50" : "text-white/45"}`}>
                  {t("tokenPacks.tokenName")}
                </span>
              </p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
