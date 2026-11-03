// The desk (users, orders, codes, iCash issuances, sells, audit) lives in PostgreSQL via Prisma.
// Production: Neon — pooled DATABASE_URL at runtime, DATABASE_URL_UNPOOLED for migrations.

export function databaseConfigured() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}
