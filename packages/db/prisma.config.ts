import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: "../../apps/web/.env",
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Prisma CLI migrations use Neon's direct connection; local PostgreSQL
    // setups can continue to use DATABASE_URL alone.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
