"use client";

import { useRouter } from "next/navigation";
import { BuyDesk } from "@/components/buy-desk";
import { Hero } from "@/components/hero";
import { TokenPacks } from "@/components/token-packs";
import type { DepositAccount } from "@/lib/deposit";
import type { PublicProduct } from "@/lib/types";

export function HomeDesk({
  products,
  deposits,
}: {
  products: PublicProduct[];
  deposits: DepositAccount[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-10 lg:space-y-12">
      <TokenPacks selectedTokens={null} onPick={(pack) => router.push(`/token/${pack.tokens}`)} />
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:gap-14">
        <Hero bare />
        <BuyDesk products={products} deposits={deposits} embedded />
      </div>
    </div>
  );
}
