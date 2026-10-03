import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (verifyAdminSession(jar.get("vaulta_admin")?.value)) redirect("/admin");

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-24">
      <div className="mx-auto w-full max-w-sm">
        <BrandLogo size="lg" />
        <h1 className="mt-8 display text-5xl leading-none">Owner desk</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The local password is printed in the terminal running the app, and saved in .data/admin-password.txt. If you set ADMIN_PASSWORD, that value is used instead.
        </p>
        <div className="mt-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
