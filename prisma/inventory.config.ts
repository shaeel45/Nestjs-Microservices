import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "inventory/schema.prisma",
  migrations: {
    path: "migrations/inventory",
  },
  engine: "classic",
  datasource: {
    url: env("INVENTORY_DATABASE_URL"),
  },
});
