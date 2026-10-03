// Local demo orders live in src/lib/store.ts so the desk runs without Atlas.
// When DATABASE_URL points at a MongoDB replica set, generate Prisma Client
// and move reserve/deliver onto prisma.$transaction. Pin Prisma ORM 6.19:
// Prisma 7 has no MongoDB connector, and Prisma 8 MongoDB is still a release candidate.

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
