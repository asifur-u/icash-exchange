import path from "node:path";

export function dataDir() {
  if (process.env.VAULTA_DATA_DIR) return process.env.VAULTA_DATA_DIR;
  // Vercel serverless FS is read-only except /tmp
  if (process.env.VERCEL) return path.join("/tmp", "icash-data");
  return path.join(process.cwd(), ".data");
}
