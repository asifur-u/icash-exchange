import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountProfile } from "@/components/account/account-profile";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account/profile");
  return <AccountProfile user={user} />;
}
