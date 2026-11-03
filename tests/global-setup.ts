import { spawnSync } from "node:child_process";
import path from "node:path";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:54329/icash_test";

/** Brings the test database up to the latest migration once per run (tables are emptied per test). */
export default function setup() {
  const result = spawnSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DATABASE_URL_UNPOOLED: TEST_DATABASE_URL },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Could not prepare the test database (${TEST_DATABASE_URL}):\n${result.stderr || result.stdout}`);
  }
}
