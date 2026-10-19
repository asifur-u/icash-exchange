import { missingProductionSecrets, productionSecretsReady } from "@/lib/secrets";

/** Server-only banner when Vercel production is missing required secrets. */
export function DeploySetupBanner() {
  if (process.env.NODE_ENV !== "production") return null;
  if (productionSecretsReady()) return null;

  const missing = missingProductionSecrets();
  const keys =
    missing.length > 0
      ? missing
      : ["CODE_ENCRYPTION_KEY (must be valid 32-byte base64)"];

  return (
    <div className="relative z-[60] border-b border-amber-400/30 bg-[#2a1a00] px-4 py-3 text-amber-50">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
            Deploy setup
          </p>
          <p className="mt-1 text-sm font-semibold">
            Portal live হলেও buy/login কাজ করবে না — Vercel env মিসিং।
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
            Vercel → Project → Settings → Environment Variables (Production) এ সেট করে Redeploy করো:
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
            {keys.map((key) => (
              <li
                key={key}
                className="rounded-full border border-amber-300/25 bg-black/30 px-2.5 py-1 text-amber-100"
              >
                {key}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
