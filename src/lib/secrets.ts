import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/paths";

type SecretFile = {
  encryptionKey: string;
  authSecret: string;
  adminPassword: string;
};

const globalForLog = globalThis as { __vaultaDeskLogged?: boolean; __vaultaKeyWarned?: boolean };

let memory: SecretFile | null = null;

function secretsPath() {
  return path.join(dataDir(), "secrets.json");
}

export function decodeKey(value: string) {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("CODE_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

function warnIfEnvKeyDiffers() {
  if (!process.env.CODE_ENCRYPTION_KEY || globalForLog.__vaultaKeyWarned) return;
  const file = secretsPath();
  if (!existsSync(file)) return;
  globalForLog.__vaultaKeyWarned = true;
  try {
    const saved = JSON.parse(readFileSync(file, "utf8")) as SecretFile;
    if (saved.encryptionKey && saved.encryptionKey !== process.env.CODE_ENCRYPTION_KEY) {
      console.warn(
        "CODE_ENCRYPTION_KEY differs from .data/secrets.json. Codes saved with the earlier key will not open. Delete the .data folder to start fresh, or unset CODE_ENCRYPTION_KEY to keep the saved key.",
      );
    }
  } catch {
    console.warn("iCash Exchange could not read .data/secrets.json");
  }
}

export function loadSecrets(): SecretFile {
  if (memory) return memory;
  const file = secretsPath();
  if (existsSync(file)) {
    memory = JSON.parse(readFileSync(file, "utf8")) as SecretFile;
    warnIfEnvKeyDiffers();
    return memory;
  }

  memory = {
    encryptionKey: randomBytes(32).toString("base64"),
    authSecret: randomBytes(32).toString("base64"),
    adminPassword: `icash-${randomBytes(4).toString("hex")}`,
  };
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(file, JSON.stringify(memory, null, 2));
  return memory;
}

export function getEncryptionKey() {
  if (process.env.CODE_ENCRYPTION_KEY) {
    warnIfEnvKeyDiffers();
    return decodeKey(process.env.CODE_ENCRYPTION_KEY);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("CODE_ENCRYPTION_KEY is required in production");
  }
  return decodeKey(loadSecrets().encryptionKey);
}

export function getAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }
  return loadSecrets().authSecret;
}

export function ensureDevSecrets() {
  if (process.env.NODE_ENV === "production") return;
  loadSecrets();
  if (globalForLog.__vaultaDeskLogged) return;
  globalForLog.__vaultaDeskLogged = true;
  console.info(
    "\niCash Exchange\n  Open   http://localhost:3000\n  Owner  http://localhost:3000/admin\n  First visit creates the owner email. Later owners are added in Settings.\n",
  );
}

export function missingProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return [] as string[];
  const required = ["CODE_ENCRYPTION_KEY", "AUTH_SECRET", "DATABASE_URL"];
  if (process.env.PAYMENT_MODE === "live") {
    required.push("PAYMENT_WEBHOOK_SECRET");
  }
  return required.filter((name) => !process.env[name]);
}

export function productionSecretsReady() {
  const missing = missingProductionSecrets();
  if (missing.length > 0) return false;
  try {
    decodeKey(process.env.CODE_ENCRYPTION_KEY ?? "");
    return true;
  } catch {
    return false;
  }
}

export function assertProductionSecrets() {
  const missing = missingProductionSecrets();
  if (missing.length > 0) {
    throw new Error(`Missing production environment: ${missing.join(", ")}`);
  }
  decodeKey(process.env.CODE_ENCRYPTION_KEY ?? "");
}
