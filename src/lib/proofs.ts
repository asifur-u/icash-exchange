import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeskError } from "@/lib/errors";
import { dataDir } from "@/lib/paths";

const MAX_BYTES = 2_500_000;

function proofsDir() {
  return path.join(dataDir(), "proofs");
}

export async function savePaymentProof(orderId: string, dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) throw new DeskError("BAD_INPUT", "Upload a PNG, JPG, or WebP screenshot");
  const mime = match[1]!;
  const raw = Buffer.from(match[2]!.replace(/\s+/g, ""), "base64");
  if (raw.length < 800) throw new DeskError("BAD_INPUT", "That screenshot looks empty");
  if (raw.length > MAX_BYTES) throw new DeskError("BAD_INPUT", "Screenshot must be under 2.5 MB");

  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const file = `${orderId}.${ext}`;
  await mkdir(proofsDir(), { recursive: true });
  await writeFile(path.join(proofsDir(), file), raw);
  return file;
}

export async function readPaymentProof(fileName: string) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName) || fileName.includes("..")) {
    throw new DeskError("FORBIDDEN", "Invalid proof file");
  }
  const full = path.join(proofsDir(), fileName);
  const bytes = await readFile(full);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { bytes, type };
}
