import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { TEST_DATABASE_URL } from "./global-setup";

for (const key of Object.keys(process.env)) {
  if (
    key.startsWith("ICASH_") ||
    key.startsWith("UPSTASH_") ||
    key.startsWith("SMTP_") ||
    key === "REDIS_URL" ||
    key === "RESEND_API_KEY"
  ) {
    delete process.env[key];
  }
}
process.env.CODE_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.AUTH_SECRET = randomBytes(32).toString("base64");
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.PAYMENT_MODE = "demo";
process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret";
process.env.VAULTA_DATA_DIR = mkdtempSync(path.join(tmpdir(), "vaulta-"));
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DATABASE_URL_UNPOOLED = TEST_DATABASE_URL;
