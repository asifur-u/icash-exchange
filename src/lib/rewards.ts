export type RewardTier = {
  id: string;
  name: "Silver" | "Gold" | "Platinum" | "Diamond";
  spendBdt: number;
  label: string;
  bonusPercent: number;
  blurb: string;
  accent: string;
};

/** Monthly spend thresholds (BDT) and matching bonus rates. */
export const REWARD_TIERS: RewardTier[] = [
  {
    id: "silver",
    name: "Silver",
    spendBdt: 100_000,
    label: "1 lakh",
    bonusPercent: 1.25,
    blurb: "Your first unlock. Cross ৳1,00,000 in a month and the Silver bonus turns on.",
    accent: "#c8c8c8",
  },
  {
    id: "gold",
    name: "Gold",
    spendBdt: 300_000,
    label: "3 lakh",
    bonusPercent: 2,
    blurb: "Reach ৳3,00,000 monthly and step into Gold with a stronger special bonus.",
    accent: "#e8d5a3",
  },
  {
    id: "platinum",
    name: "Platinum",
    spendBdt: 500_000,
    label: "5 lakh+",
    bonusPercent: 3,
    blurb: "Hit ৳5,00,000 or more and Platinum elevates your desk rewards again.",
    accent: "#d9e2ec",
  },
  {
    id: "diamond",
    name: "Diamond",
    spendBdt: 1_000_000,
    label: "10 lakh+",
    bonusPercent: 5,
    blurb: "Top of the ladder. ৳10,00,000+ monthly unlocks Diamond rate — and the gift.",
    accent: "#ffffff",
  },
];

export const MONTHLY_GIFT = {
  spendBdt: 1_000_000,
  giftBdt: 5_000,
  title: "Diamond monthly gift",
  blurb:
    "Spend more than ৳10,00,000 in a single calendar month and unlock a ৳5,000 special gift on top of your Diamond bonus.",
};

/** Highest tier unlocked by lifetime (or period) spend. Null = below Silver. */
export function tierForSpend(spendBdt: number): RewardTier | null {
  let current: RewardTier | null = null;
  for (const tier of REWARD_TIERS) {
    if (spendBdt >= tier.spendBdt) current = tier;
  }
  return current;
}

/** Next ladder step above current spend. */
export function nextTierForSpend(spendBdt: number): RewardTier | null {
  return REWARD_TIERS.find((tier) => spendBdt < tier.spendBdt) ?? null;
}

/** Rough bonus earned so far at the unlocked rate (display only). */
export function estimatedBonusBdt(spendBdt: number) {
  const tier = tierForSpend(spendBdt);
  if (!tier || spendBdt <= 0) return 0;
  return Math.round((spendBdt * tier.bonusPercent) / 100);
}

export function tierProgress(spendBdt: number) {
  const current = tierForSpend(spendBdt);
  const next = nextTierForSpend(spendBdt);
  if (!next) {
    return {
      current,
      next: null as RewardTier | null,
      remaining: 0,
      ratio: 1,
    };
  }
  const floor = current?.spendBdt ?? 0;
  const span = Math.max(1, next.spendBdt - floor);
  const ratio = Math.min(1, Math.max(0, (spendBdt - floor) / span));
  return {
    current,
    next,
    remaining: Math.max(0, next.spendBdt - spendBdt),
    ratio,
  };
}
