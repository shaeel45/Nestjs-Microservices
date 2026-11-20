import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "promocodes/schema.prisma",
  migrations: {
    path: "migrations/promocodes",
  },
  engine: "classic",
  datasource: {
    url: env("PROMOCODES_DATABASE_URL"),
  },
});
