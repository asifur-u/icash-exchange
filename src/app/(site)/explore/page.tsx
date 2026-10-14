import type { Metadata } from "next";
import { RewardsExplorer } from "@/components/rewards-explorer";

export const metadata: Metadata = {
  title: "Explore rewards",
  description:
    "Climb the iCash loyalty ladder — Silver, Gold, Platinum, Diamond. From 1.25% at 1 lakh to 5% at 10 lakh, plus a ৳5,000 Diamond gift.",
};

export default function ExplorePage() {
  return <RewardsExplorer />;
}
