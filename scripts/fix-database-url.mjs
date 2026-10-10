import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), ".env.local");
if (!existsSync(path)) {
  console.log("NO_ENV_LOCAL");
  process.exit(1);
}

let text = readFileSync(path, "utf8");
const match = text.match(/^DATABASE_URL=(.*)$/m);
if (!match) {
  console.log("NO_DATABASE_URL");
  process.exit(0);
}

let raw = match[1].trim();
if (
  (raw.startsWith('"') && raw.endsWith('"')) ||
  (raw.startsWith("'") && raw.endsWith("'"))
) {
  raw = raw.slice(1, -1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.log("PARSE_FAIL");
  process.exit(1);
}

const db = url.pathname.replace(/^\//, "").trim();
console.log(`beforeDb=${db || "(empty)"}`);
if (db) {
  console.log("PATCHED=false");
  process.exit(0);
}

const queryIndex = raw.indexOf("?");
const base = (queryIndex >= 0 ? raw.slice(0, queryIndex) : raw).replace(/\/$/, "");
const query = queryIndex >= 0 ? raw.slice(queryIndex) : "";
const fixed = `${base}/icash${query}`;
text = text.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${fixed}`);
writeFileSync(path, text);
console.log(`afterDb=${new URL(fixed).pathname.replace(/^\//, "")}`);
console.log("PATCHED=true");
