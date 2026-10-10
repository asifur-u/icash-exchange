import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return { path, missing: true, vars: {} };
  const text = readFileSync(path, "utf8");
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return { path, missing: false, vars };
}

const local = loadEnvFile(".env.local");
const env = loadEnvFile(".env");
const merged = { ...env.vars, ...local.vars };

const keys = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "AUTH_SECRET",
  "ADMIN_PASSWORD",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];

console.log("env_files", {
  env: env.missing ? "missing" : "present",
  envLocal: local.missing ? "missing" : "present",
});

for (const key of keys) {
  const value = merged[key];
  if (!value) {
    console.log(`${key}=MISSING`);
    continue;
  }
  const info = { set: true, len: value.length };
  if (key === "DATABASE_URL") {
    try {
      const u = new URL(value.trim());
      const db = u.pathname.replace(/^\//, "").trim();
      info.scheme = u.protocol.replace(":", "");
      info.host = u.hostname;
      info.dbName = db || "(empty)";
      info.usable = Boolean(db);
    } catch {
      info.parseError = true;
      info.usable = false;
    }
  }
  console.log(`${key}=SET`, JSON.stringify(info));
}
