import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const htmlPath = path.join(os.tmpdir(), "icash-home.html");
const html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf('aria-label="logo-link"');
if (start < 0) throw new Error("logo-link not found");
const slice = html.slice(start, start + 20000);
const match = slice.match(/<svg[\s\S]*?<\/svg>/);
if (!match) throw new Error("svg not found");

const outDir = path.join(process.cwd(), "public", "brand");
fs.mkdirSync(outDir, { recursive: true });

const dark = match[0];
const light = dark
  .replace(/fill="#191818"/g, 'fill="#FFFFFF"')
  .replace(/fill="#191818"/gi, 'fill="#FFFFFF"');

fs.writeFileSync(path.join(outDir, "icash-one-wordmark-dark.svg"), dark);
fs.writeFileSync(path.join(outDir, "icash-one-wordmark.svg"), light);
console.log("wrote wordmarks", dark.length, light.length);
