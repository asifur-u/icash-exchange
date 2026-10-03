"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-5 py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Desk</p>
      <h1 className="mt-4 display text-4xl">Something went wrong.</h1>
      <p className="mt-4 text-muted">The page did not finish. Codes already on the desk stay where they are.</p>
      <button type="button" className="mt-8 h-12 rounded-full bg-gold px-6 text-black" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
