import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "orders/schema.prisma",
  migrations: {
    path: "migrations/orders",
  },
  engine: "classic",
  datasource: {
    url: env("ORDERS_DATABASE_URL"),
  },
});
