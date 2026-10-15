"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";
import { REWARD_TIERS, type RewardTier } from "@/lib/rewards";

const STAGES = [
  { id: "guest", name: "Guest", accent: "#e11d2e", bonusPercent: 0, spendBdt: 0 },
  ...REWARD_TIERS,
] as const;

type Progress = {
  current: RewardTier | null;
  next: RewardTier | null;
  remaining: number;
  ratio: number;
};

function stageIndex(current: RewardTier | null) {
  if (!current) return 0;
  return REWARD_TIERS.findIndex((tier) => tier.id === current.id) + 1;
}

export function AccountLoyaltyStage({
  spent,
  progress,
}: {
  spent: number;
  progress: Progress;
}) {
  const t = useT();
  const active = stageIndex(progress.current);
  const accent = progress.current?.accent ?? progress.next?.accent ?? "#ca8a04";
  const pct = Math.round(progress.ratio * 100);

  const support =
    active >= 3
      ? { label: t("account.supportPriorityPlus"), detail: t("account.supportPriorityPlusBody") }
      : active >= 2
        ? { label: t("account.supportPriority"), detail: t("account.supportPriorityBody") }
        : active >= 1
          ? { label: t("account.supportPlus"), detail: t("account.supportPlusBody") }
          : { label: t("account.supportStd"), detail: t("account.supportStdBody") };

  return (
    <section className="al-card overflow-hidden" style={{ color: "#09090b" }}>
      <div className="border-b px-5 py-5 sm:px-7 sm:py-6" style={{ borderColor: "#e4e4e7" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#b45309" }}
            >
              {t("account.yourStage")}
            </p>
            <h2 className="al-ink mt-2 text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-tight">
              {STAGES[active].name}
              {progress.current ? (
                <span className="ml-2 text-[0.55em] font-semibold" style={{ color: "#b45309" }}>
                  {progress.current.bonusPercent}%
                </span>
              ) : (
                <span className="al-faint ml-2 text-[0.55em] font-semibold">
                  {t("account.climbingSilver")}
                </span>
              )}
            </h2>
            <p className="al-muted mt-2 max-w-lg text-sm">
              {t("account.lifetimeSpend", { amount: formatBdt(spent) })}
              {progress.next
                ? ` ${t("account.moreUnlocks", {
                    amount: formatBdt(progress.remaining),
                    name: progress.next.name,
                  })}`
                : ` ${t("account.topLadder")}`}
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 text-right"
            style={{ border: "1px solid #fde68a", background: "#fffbeb" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#b45309" }}
            >
              {t("account.progress")}
            </p>
            <p className="al-ink mt-1 text-2xl font-bold tabular-nums">
              {progress.next ? `${pct}%` : "100%"}
            </p>
            <p className="al-muted mt-0.5 text-xs">
              {progress.next
                ? t("account.toTier", { name: progress.next.name })
                : t("account.maxStage")}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-1">
            {STAGES.map((stage, index) => {
              const unlocked = index <= active;
              const isCurrent = index === active;
              return (
                <div key={stage.id} className="flex flex-1 items-center">
                  <div className="flex min-w-0 flex-col items-center gap-2">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[10px] font-bold sm:h-12 sm:w-12 sm:text-xs"
                      style={{
                        background: unlocked ? stage.accent : "#f4f4f5",
                        color: unlocked ? "#111" : "#a1a1aa",
                        border: unlocked ? "none" : "1px solid #e4e4e7",
                        boxShadow: isCurrent ? `0 0 0 3px ${stage.accent}55` : "none",
                      }}
                    >
                      {stage.name.slice(0, isCurrent ? 3 : 1)}
                    </div>
                    <p
                      className="truncate text-[10px] font-semibold sm:text-xs"
                      style={{
                        color: isCurrent ? "#09090b" : unlocked ? "#52525b" : "#d4d4d8",
                      }}
                    >
                      {stage.name}
                    </p>
                  </div>
                  {index < STAGES.length - 1 ? (
                    <div
                      className="mx-0.5 mb-6 h-1 flex-1 overflow-hidden rounded-full sm:mx-1"
                      style={{ background: "#f4f4f5" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: index < active ? "100%" : "0%",
                          background: "#18181b",
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full" style={{ background: "#f4f4f5" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress.next ? pct : 100}%`,
                background: `linear-gradient(90deg, #e11d2e, ${accent}, #ca8a04)`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
        <div
          className="rounded-2xl px-4 py-4"
          style={{ border: "1px solid #fde68a", background: "#fffbeb" }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#92400e" }}
          >
            {t("account.deskSupport")}
          </p>
          <p className="al-ink mt-2 text-lg font-bold">{support.label}</p>
          <p className="al-muted mt-1 text-sm leading-relaxed">{support.detail}</p>
          <Link
            href="/account/support"
            className="mt-3 inline-flex text-sm font-semibold"
            style={{ color: "#92400e" }}
          >
            {t("account.openHelp")}
          </Link>
        </div>
        <div
          className="rounded-2xl px-4 py-4"
          style={{ border: "1px solid #e4e4e7", background: "#fafafa" }}
        >
          <p className="al-faint text-[11px] font-semibold uppercase tracking-[0.14em]">
            {t("account.nextUnlock")}
          </p>
          {progress.next ? (
            <>
              <p className="al-ink mt-2 text-lg font-bold">
                {progress.next.name} · {progress.next.bonusPercent}%
              </p>
              <p className="al-muted mt-1 text-sm">
                {t("account.needMore", {
                  amount: formatBdt(progress.remaining),
                  label: progress.next.label,
                })}
              </p>
            </>
          ) : (
            <>
              <p className="al-ink mt-2 text-lg font-bold">{t("account.diamondGift")}</p>
              <p className="al-muted mt-1 text-sm">{t("account.diamondGiftBody")}</p>
            </>
          )}
          <Link href="/explore" className="al-accent mt-3 inline-flex text-sm font-semibold">
            {t("account.fullLadder")}
          </Link>
        </div>
      </div>
    </section>
  );
}
