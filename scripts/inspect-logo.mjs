import fs from "node:fs";

const s = fs.readFileSync("public/brand/icash-one-wordmark.svg", "utf8");
const fills = [...s.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
console.log("unique fills", [...new Set(fills)]);
console.log("len", s.length);
console.log(s.slice(0, 400));
