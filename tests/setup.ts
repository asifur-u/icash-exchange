import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";

process.env.CODE_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.AUTH_SECRET = randomBytes(32).toString("base64");
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.PAYMENT_MODE = "demo";
process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret";
process.env.VAULTA_DATA_DIR = mkdtempSync(path.join(tmpdir(), "vaulta-"));
