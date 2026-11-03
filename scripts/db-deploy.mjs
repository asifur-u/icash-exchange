// Applies pending Prisma migrations during `npm run build` when a Postgres URL is present.
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.log("db-deploy: DATABASE_URL is not Postgres, skipping migrations.");
  process.exit(0);
}
if (!process.env.DATABASE_URL_UNPOOLED) process.env.DATABASE_URL_UNPOOLED = url;

const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
