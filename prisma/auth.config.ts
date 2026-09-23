import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "auth/schema.prisma",
  migrations: {
    path: "migrations/auth",
  },
  engine: "classic",
  datasource: {
    url: env("AUTH_DATABASE_URL"),
  },
});
