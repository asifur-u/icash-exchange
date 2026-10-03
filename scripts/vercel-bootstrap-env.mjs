import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const scope = "profitnex-7128s-projects";
const target = "production";

const values = {
  CODE_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  AUTH_SECRET: randomBytes(32).toString("base64"),
  ADMIN_PASSWORD: `icash-${randomBytes(4).toString("hex")}`,
  PAYMENT_MODE: "demo",
  NEXT_PUBLIC_SITE_URL: "https://icash-exchange.vercel.app",
  VAULTA_DATA_DIR: "/tmp/icash-data",
};

function run(args, input) {
  const result = spawnSync("npx", ["vercel", ...args, "--scope", scope], {
    input,
    encoding: "utf8",
    shell: true,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

for (const [name, value] of Object.entries(values)) {
  run(["env", "rm", name, target, "--yes"]);
  const added = run(["env", "add", name, target], `${value}\n`);
  if (added.status !== 0) {
    console.error(`Failed to set ${name}`);
    console.error(added.stdout);
    console.error(added.stderr);
    process.exit(1);
  }
  console.log(`set ${name} → ${target}`);
}

console.log("");
console.log("ADMIN_PASSWORD (save this):", values.ADMIN_PASSWORD);
console.log("Done. Redeploy production next.");
