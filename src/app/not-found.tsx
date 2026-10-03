import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">404</p>
      <h1 className="mt-4 display text-5xl">This page is not on the desk.</h1>
      <Link href="/" className="mt-8 text-gold">
        Return home
      </Link>
    </div>
  );
}
