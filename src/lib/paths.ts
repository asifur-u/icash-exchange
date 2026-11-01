import path from "node:path";

/** Writable desk directory. On Vercel only /tmp is writable. */
export function dataDir() {
  const configured = process.env.VAULTA_DATA_DIR?.trim();
  const onVercel = Boolean(process.env.VERCEL);
  const vercelSafe = path.join("/tmp", "icash-data");

  if (configured) {
    // Relative paths (e.g. ".data") resolve under a read-only cwd on Vercel.
    if (onVercel && !path.isAbsolute(configured)) return vercelSafe;
    if (onVercel && !configured.startsWith("/tmp")) return vercelSafe;
    return configured;
  }

  if (onVercel) return vercelSafe;
  return path.join(process.cwd(), ".data");
}
