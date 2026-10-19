"use client";

function setupHint(message: string | undefined) {
  if (!message) return null;
  const lower = message.toLowerCase();
  if (
    lower.includes("missing production environment") ||
    lower.includes("code_encryption_key") ||
    lower.includes("auth_secret") ||
    lower.includes("admin_password")
  ) {
    return {
      title: "Production secrets missing",
      body: "Vercel → Project → Settings → Environment Variables এ এই তিনটা দাও, তারপর Redeploy করো:",
      vars: ["ADMIN_PASSWORD", "AUTH_SECRET", "CODE_ENCRYPTION_KEY"],
    };
  }
  return null;
}

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hint = setupHint(error.message);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-5 py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Desk</p>
      <h1 className="mt-4 display text-4xl">
        {hint ? "Deploy setup needed." : "Something went wrong."}
      </h1>
      <p className="mt-4 text-muted">
        {hint
          ? hint.body
          : "The page did not finish. Codes already on the desk stay where they are."}
      </p>

      {hint ? (
        <ul className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 font-mono text-sm text-white/80">
          {hint.vars.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : null}

      {error.message ? (
        <p className="mt-4 break-words font-mono text-xs text-white/40">{error.message}</p>
      ) : null}

      <button
        type="button"
        className="mt-8 h-12 rounded-full bg-gold px-6 text-black"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
