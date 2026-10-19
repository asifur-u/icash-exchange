import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (verifyAdminSession(jar.get("vaulta_admin")?.value)) redirect("/admin");

  return <AdminLogin isProd={process.env.NODE_ENV === "production"} />;
}
