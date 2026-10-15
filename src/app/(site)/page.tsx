import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { HomeFaq } from "@/components/home-faq";
import { HomeWhy } from "@/components/home-why";
import { HowItWorks } from "@/components/how-it-works";
import { Platforms } from "@/components/platforms";
import { VoucherShowcase } from "@/components/voucher-showcase";
import { getCurrentUser } from "@/lib/session";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "iCash Exchange" },
  description: "Buy a digital note on iCash Exchange. Pay, then read the code on your order page.",
};

export default async function HomePage() {
  const [products, user] = await Promise.all([getPublicProducts(), getCurrentUser()]);

  return (
    <>
      <Hero products={products} loggedIn={Boolean(user)} />
      <VoucherShowcase products={products} />
      <Platforms />
      <HomeWhy />
      <HowItWorks />
      <HomeFaq />
    </>
  );
}
