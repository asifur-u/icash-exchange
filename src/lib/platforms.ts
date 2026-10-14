/**
 * iCash.one collaborators only — no betting / gambling brands.
 * Marketplaces, distributors, payment partners, authorized agents.
 */
export type Platform = {
  id: string;
  label: string;
  blurb: string;
  logo: string;
  role: "network" | "marketplace" | "distributor" | "agent" | "payments";
  href?: string;
};

export const platforms: Platform[] = [
  {
    id: "icash-one",
    label: "iCash.one",
    blurb: "The global prepaid network this desk is authorized under.",
    logo: "/brand/icash-one-wordmark-dark.svg",
    role: "network",
    href: "https://www.icash.one",
  },
  {
    id: "eneba",
    label: "Eneba",
    blurb: "Official marketplace partner — buy iCash.one vouchers on Eneba.",
    logo: "/partners/eneba.svg",
    role: "marketplace",
    href: "https://www.eneba.com",
  },
  {
    id: "bamboo",
    label: "Bamboo Card",
    blurb: "B2B distributor partner for iCash.one digital vouchers.",
    logo: "/partners/bamboo.svg",
    role: "distributor",
    href: "https://www.bamboocard.co",
  },
  {
    id: "praxis",
    label: "Praxis",
    blurb: "Payments collaborator expanding merchant access with iCash.one.",
    logo: "/partners/praxis.svg",
    role: "payments",
  },
  {
    id: "baxity",
    label: "Baxity",
    blurb: "Authorized agent channel for genuine iCash.one notes.",
    logo: "/partners/baxity.svg",
    role: "agent",
    href: "https://www.baxity.com",
  },
  {
    id: "offgamers",
    label: "OffGamers",
    blurb: "Verified gift & game marketplace listed with iCash.one agents.",
    logo: "/partners/offgamers.svg",
    role: "agent",
    href: "https://www.offgamers.com",
  },
  {
    id: "moogold",
    label: "MooGold",
    blurb: "Authorized reseller for iCash.one prepaid voucher delivery.",
    logo: "/partners/moogold.svg",
    role: "agent",
    href: "https://www.moogold.com",
  },
];
