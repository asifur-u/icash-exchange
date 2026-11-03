export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.npm_lifecycle_event === "build") return;

  if (process.env.NODE_ENV === "production") {
    const { missingProductionSecrets, productionSecretsReady } = await import("@/lib/secrets");
    const missing = missingProductionSecrets();
    if (missing.length > 0 || !productionSecretsReady()) {
      // Don't crash the whole runtime — pages show a setup banner instead.
      console.error(
        `[iCash] Production secrets missing or invalid: ${
          missing.length ? missing.join(", ") : "CODE_ENCRYPTION_KEY invalid"
        }. Set them in the VPS .env file (or the host environment), then restart.`,
      );
      return;
    }
    return;
  }

  const { ensureDevSecrets } = await import("@/lib/secrets");
  ensureDevSecrets();
}
