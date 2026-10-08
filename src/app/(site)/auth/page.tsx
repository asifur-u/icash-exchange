import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPortal } from "@/components/auth-portal";
import { Frame } from "@/components/frame";
import { ProcessSteps } from "@/components/process-steps";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const nextPath = safeNext(query.next);
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <section className="bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-32">
      <Frame>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Account</p>
          <h1 className="mt-4 display text-[clamp(2.4rem,10vw,4.5rem)]">
            Log in before <span className="accent-red">you buy.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            Create a free account, then go to your dashboard. From there you pick a note, send the deposit, and read the code.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-2xl">
          <ProcessSteps current={2} />
        </div>
        <div className="mt-10">
          <AuthPortal nextPath={nextPath} />
        </div>
      </Frame>
    </section>
  );
}

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}
