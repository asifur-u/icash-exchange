import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeskError } from "@/lib/errors";
import { imageKitConfigured, uploadToImageKit } from "@/lib/imagekit";
import { dataDir } from "@/lib/paths";

const MAX_BYTES = 2_500_000;

function proofsDir() {
  return path.join(dataDir(), "proofs");
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) throw new DeskError("BAD_INPUT", "Upload a PNG, JPG, or WebP screenshot");
  const mime = match[1]!;
  const raw = Buffer.from(match[2]!.replace(/\s+/g, ""), "base64");
  if (raw.length < 800) throw new DeskError("BAD_INPUT", "That screenshot looks empty");
  if (raw.length > MAX_BYTES) throw new DeskError("BAD_INPUT", "Screenshot must be under 2.5 MB");
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { mime, raw, ext };
}

/** Returns a local filename, or an ImageKit URL when configured. */
export async function savePaymentProof(orderId: string, dataUrl: string) {
  const { mime, raw, ext } = parseDataUrl(dataUrl);

  if (imageKitConfigured()) {
    const uploaded = await uploadToImageKit({
      buffer: raw,
      fileName: `${orderId}.${ext}`,
      folder: "/icash/proofs",
      mime,
    });
    return uploaded.url;
  }

  const file = `${orderId}.${ext}`;
  await mkdir(proofsDir(), { recursive: true });
  await writeFile(path.join(proofsDir(), file), raw);
  return file;
}

export async function readPaymentProof(fileName: string) {
  if (fileName.startsWith("https://") || fileName.startsWith("http://")) {
    const response = await fetch(fileName);
    if (!response.ok) throw new DeskError("NOT_FOUND", "Proof image missing");
    const bytes = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get("content-type") || "image/jpeg";
    return { bytes, type, remoteUrl: fileName };
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName) || fileName.includes("..")) {
    throw new DeskError("FORBIDDEN", "Invalid proof file");
  }
  const full = path.join(proofsDir(), fileName);
  const bytes = await readFile(full);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { bytes, type };
}

export async function saveAvatarImage(userId: string, dataUrl: string) {
  const { mime, raw, ext } = parseDataUrl(dataUrl);
  if (!imageKitConfigured()) {
    throw new DeskError("BAD_INPUT", "ImageKit is not configured. Add IMAGEKIT_* keys to upload avatars.");
  }
  return uploadToImageKit({
    buffer: raw,
    fileName: `avatar-${userId}.${ext}`,
    folder: "/icash/avatars",
    mime,
  });
}
