// Local demo orders live in src/lib/store.ts so the desk runs without Atlas.
// When DATABASE_URL points at a MongoDB replica set, generate Prisma Client
// and move reserve/deliver onto prisma.$transaction. Pin Prisma ORM 6.19:
// Prisma 7 has no MongoDB connector, and Prisma 8 MongoDB is still a release candidate.

export function databaseConfigured() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  if (!(url.startsWith("mongodb://") || url.startsWith("mongodb+srv://"))) return false;
  try {
    // Atlas rejects URLs with an empty path (`…mongodb.net/` / `…mongodb.net`).
    const dbName = new URL(url).pathname.replace(/^\//, "").trim();
    return Boolean(dbName);
  } catch {
    return false;
  }
}
