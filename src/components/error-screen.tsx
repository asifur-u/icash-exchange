"use client";

import Link from "next/link";
import { isDbBusy } from "@/lib/errors";

export function ErrorScreen({
  error,
  reset,
  title,
  body,
  busyTitle,
  busyBody,
  retry,
  home,
  kicker,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
  title: string;
  body: string;
  busyTitle: string;
  busyBody: string;
  retry: string;
  home: string;
  kicker: string;
}) {
  const busy = isDbBusy(error);
  const headline = busy ? busyTitle : title;
  const lead = busy ? busyBody : body;
  const showDetail = process.env.NODE_ENV === "development" && Boolean(error?.message);

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-48 w-48 -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{kicker}</p>
      <h1 className="mt-4 text-[2.1rem] font-semibold tracking-tight text-white sm:text-[2.45rem]">{headline}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-white/50">{lead}</p>
      {showDetail ? (
        <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/45">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
            Details
          </summary>
          <p className="mt-3 break-words font-mono text-[11px] leading-relaxed text-white/40">{error?.message}</p>
        </details>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black"
        >
          {retry}
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white"
        >
          {home}
        </Link>
      </div>
    </div>
  );
}
