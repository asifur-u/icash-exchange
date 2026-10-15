import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPortal } from "@/components/auth-portal";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const points = [
  {
    title: "One buyer, one code",
    body: "Your note is held while you pay. Nobody else can take that code.",
  },
  {
    title: "Local payments",
    body: "bKash, Nagad, Rocket or bank. Send the exact amount, then upload proof.",
  },
  {
    title: "Codes in your dashboard",
    body: "After the desk confirms the deposit, open the order and copy the code.",
  },
];

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; resume?: string }>;
}) {
  const query = await searchParams;
  const nextPath = safeNext(query.next);
  const resumePath = safeResume(query.resume);
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  return (
    <section className="min-h-[100dvh] bg-black">
      <div className="grid min-h-[100dvh] lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#0a0a0a] px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#ff2d2d]/15 blur-[100px]"
          />
          <div>
            <Link href="/" className="inline-flex">
              <BrandLogo size="md" />
            </Link>
            <p className="mt-16 text-sm font-semibold uppercase tracking-[0.22em] text-white/40">
              iCash Exchange
            </p>
            <h2 className="mt-5 max-w-md display text-[clamp(2.8rem,5vw,4.4rem)]">
              Log in first.
              <span className="block accent-red">Then buy.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
              Guests must log in before checkout. New? Register in one step, then your dashboard
              opens.
            </p>
          </div>

          <ul className="relative mt-16 space-y-5">
            {points.map((point) => (
              <li key={point.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-base font-semibold tracking-tight text-white">{point.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{point.body}</p>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-col px-5 pb-10 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:py-14 xl:px-20">
          <div className="mb-10 flex items-center justify-between lg:mb-0 lg:justify-end">
            <Link href="/" className="lg:hidden">
              <BrandLogo size="sm" />
            </Link>
            <Link href="/" className="text-sm font-medium text-white/50 transition hover:text-white">
              Back to home
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-6 lg:py-10">
            <AuthPortal nextPath={nextPath} resumePath={resumePath} />
          </div>
        </div>
      </div>
    </section>
  );
}

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function safeResume(value: string | undefined) {
  if (!value || !value.startsWith("/checkout") || value.startsWith("//")) return null;
  return value;
}
