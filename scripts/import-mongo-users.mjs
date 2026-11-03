// One-time copy of registered users from the old MongoDB (Prisma "User" collection) into Postgres.
// Keeps each user's id (the ObjectId hex) so existing sessions stay valid. Safe to re-run: existing
// ids/emails are skipped. Reads Mongo only — it never writes or deletes there.
//
//   MONGO_URL=mongodb+srv://… DATABASE_URL=postgresql://… npm run db:import-mongo-users -- --dry-run
//   MONGO_URL=mongodb+srv://… DATABASE_URL=postgresql://… npm run db:import-mongo-users
import dns from "node:dns";
import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";

const dryRun = process.argv.includes("--dry-run");
const mongoUrl = process.env.MONGO_URL?.trim();
if (!mongoUrl) {
  console.error("Set MONGO_URL to the old MongoDB connection string.");
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
  console.error("Set DATABASE_URL to the Postgres database that should receive the users.");
  process.exit(1);
}
process.env.DATABASE_URL_UNPOOLED ??= process.env.DATABASE_URL;

const mongo = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 15_000 });
const prisma = new PrismaClient();

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

async function connect() {
  try {
    await mongo.connect();
  } catch (error) {
    // Some Windows/ISP resolvers refuse the SRV lookup behind mongodb+srv:// — retry via public DNS.
    if (!String(error?.syscall ?? error?.message).includes("querySrv")) throw error;
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    await mongo.connect();
  }
}

try {
  await connect();
  const docs = await mongo.db().collection("User").find({}).toArray();
  const rows = [];
  const skipped = [];
  for (const doc of docs) {
    const email = text(doc.email).trim().toLowerCase();
    const passwordHash = text(doc.passwordHash);
    if (!email || !passwordHash.includes(":")) {
      skipped.push(String(doc._id));
      continue;
    }
    rows.push({
      id: String(doc._id),
      name: text(doc.name, email.split("@")[0]),
      email,
      phone: text(doc.phone),
      passwordHash,
      role: doc.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      avatarUrl: text(doc.avatarUrl) || null,
      imageKitFileId: text(doc.imageKitFileId) || null,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
    });
  }

  const existing = await prisma.user.findMany({
    where: { OR: [{ id: { in: rows.map((row) => row.id) } }, { email: { in: rows.map((row) => row.email) } }] },
    select: { id: true, email: true },
  });
  const taken = new Set(existing.flatMap((row) => [row.id, row.email]));
  const fresh = rows.filter((row) => !taken.has(row.id) && !taken.has(row.email));

  console.log(`Mongo users: ${docs.length}`);
  console.log(`Unusable (no email or password hash): ${skipped.length}`);
  console.log(`Already in Postgres: ${rows.length - fresh.length}`);
  console.log(`${dryRun ? "Would import" : "Importing"}: ${fresh.length}`);

  if (!dryRun && fresh.length > 0) {
    const result = await prisma.user.createMany({ data: fresh, skipDuplicates: true });
    console.log(`Imported: ${result.count}`);
  }
} finally {
  await mongo.close().catch(() => undefined);
  await prisma.$disconnect();
}
