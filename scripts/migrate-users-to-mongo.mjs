/**
 * One-time: copy .data/users.json into MongoDB (Prisma User model).
 *
 * Usage:
 *   DATABASE_URL="mongodb+srv://..." node scripts/migrate-users-to-mongo.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const file = path.join(process.cwd(), ".data", "users.json");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL first");
  }
  const raw = await readFile(file, "utf8");
  const db = JSON.parse(raw);
  if (!db?.users?.length) {
    console.log("No users to migrate.");
    return;
  }

  let ok = 0;
  let skip = 0;
  for (const user of db.users) {
    try {
      await prisma.user.create({
        data: {
          name: user.name,
          email: String(user.email).toLowerCase(),
          phone: user.phone,
          passwordHash: user.passwordHash,
          avatarUrl: user.avatarUrl ?? null,
          imageKitFileId: user.imageKitFileId ?? null,
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        },
      });
      ok += 1;
    } catch (error) {
      if (error?.code === "P2002") {
        skip += 1;
        continue;
      }
      throw error;
    }
  }
  console.log(`Migrated ${ok} users, skipped ${skip} duplicates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
