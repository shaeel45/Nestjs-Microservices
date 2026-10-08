import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "products/schema.prisma",
  migrations: {
    path: "migrations/products",
  },
  engine: "classic",
  datasource: {
    url: env("PRODUCTS_DATABASE_URL"),
  },
});