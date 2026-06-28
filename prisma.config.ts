// prisma.config.ts — used by the Prisma CLI (migrate, db push, studio)
// The PrismaClient runtime connection is configured in src/lib/db.ts via PrismaPg adapter.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL is the session-mode / direct Supabase URL (port 5432).
// It is only needed for CLI commands (migrate, db push). During `prisma generate`
// at build time it can safely be empty — generate only reads the schema file.
const directUrl = process.env["DIRECT_URL"] ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(directUrl && {
    datasource: { url: directUrl },
  }),
});
