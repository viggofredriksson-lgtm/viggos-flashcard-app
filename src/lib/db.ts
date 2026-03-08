import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Why this pattern?
// In development, Next.js hot-reloads your code on every save.
// Each reload would create a NEW PrismaClient (a new database connection).
// After a few saves, you'd have dozens of connections and get errors.
//
// The fix: store the client on `globalThis` (a global object that survives hot reloads).
// In production, this just creates one client normally.

// Prisma v7 requires a "driver adapter" — it no longer connects to databases directly.
// For SQLite, we use LibSQL (an open-source SQLite fork) as the adapter.
// The file: URL points to our local SQLite database file.

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: `file:${process.cwd()}/dev.db`,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
