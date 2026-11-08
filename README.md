# ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า

Internal workspace for real estate agents. Agents can manage property records, external listing checklists, customers, and appointments. Owners and customers are records only; they do not have accounts.

## Features

- Agent registration and login with username and password, salted password hashes, and persistent sessions.
- Property records with owner details, property information, posting checklists for DDproperty, LivingInsider, and Facebook, and status history.
- Property status filters for ทั้งหมด, ว่าง, กำลังดำเนินการ, and ขายแล้ว.
- Customer contact and requirement records.
- Appointment records with agent-specific overlap checks.
- Thai interface with the main menus อสังหาริมทรัพย์, นัดหมาย, and ลูกค้า.

## Getting started

Requirements: Node.js, pnpm, and PostgreSQL (local or Neon). To use the included database container, Docker Desktop must be running.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `apps/web/.env` and set the database connection. For Neon, copy both connection strings from the Neon dashboard: use the pooled host (with `-pooler`) for `DATABASE_URL` and the direct host for `DIRECT_URL`. Keep this file out of Git. The shared runtime configuration also requires the two compatibility values shown below:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@EP-POOLER.REGION.aws.neon.tech:5432/DB?sslmode=require"
   DIRECT_URL="postgresql://USER:PASSWORD@EP.REGION.aws.neon.tech:5432/DB?sslmode=require"
   BETTER_AUTH_SECRET="replace-with-at-least-32-characters"
   BETTER_AUTH_URL="http://localhost:3001"
   ```

   For the included Docker database, use `DATABASE_URL="postgresql://postgres:password@localhost:5432/RealEstateProject"` and omit `DIRECT_URL`. Start PostgreSQL from the repository root with `docker compose up -d postgres`. Set `POSTGRES_PASSWORD` in the root environment if you use a different password.

3. Apply the database migrations. Prisma CLI uses `DIRECT_URL` when set, so verify that it points to the intended Neon branch before running this command. On a fresh database:

   ```bash
   pnpm --filter @RealEstateProject/db db:migrate:deploy
   ```

   If this database was previously created with `pnpm db:push` and has the
   existing `Agent`, `Customer`, and `PropertyPosting` tables but no Prisma
   migration history, mark the matching baseline as applied once, then deploy:

   ```bash
   pnpm --filter @RealEstateProject/db exec prisma migrate resolve --applied 0000_init
   pnpm --filter @RealEstateProject/db db:migrate:deploy
   ```

   The alignment migration keeps existing tables and rows, backfills the
   publication check and status history fields, and adds the new relations.
   Back up an existing database before applying it. Use
   `pnpm --filter @RealEstateProject/db db:generate` after pulling schema
   changes without reinstalling dependencies.

   The document's 31 SQL queries are adapted to the existing physical table
   and column names in `packages/db/query-table.sql`. To execute every query
   against a database without retaining test rows, set `QUERY_TEST_DATABASE_URL`
   to its connection URL and run:

   ```bash
   pnpm --filter @RealEstateProject/db db:verify-queries
   ```

   The verifier wraps all writes in a transaction and rolls it back. Use a
   direct Neon connection URL for this check; the URL is never committed.

4. Start the web app:

   ```bash
   pnpm --filter web dev
   ```

   Open [http://localhost:3001](http://localhost:3001). The root page directs agents to the dashboard after login and other visitors to the login page. New agents can register from there.

## Useful commands

- `pnpm --filter web check-types` — check web TypeScript types.
- `pnpm --filter web build` — build the web app.
- `pnpm db:generate` — generate the Prisma client.
- `pnpm db:studio` — open Prisma Studio.
- `docker compose down` — stop the local services.

The Next.js app is in `apps/web`, the Prisma schema and client are in `packages/db`, and shared UI styles are in `packages/ui`.
