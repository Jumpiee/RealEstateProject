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

Requirements: Node.js, pnpm, and PostgreSQL. To use the included database container, Docker Desktop must be running.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `apps/web/.env` and set the connection to your local PostgreSQL database. The shared runtime configuration also requires the two compatibility values shown below:

   ```dotenv
   DATABASE_URL="postgresql://postgres:password@localhost:5432/RealEstateProject"
   BETTER_AUTH_SECRET="replace-with-at-least-32-characters"
   BETTER_AUTH_URL="http://localhost:3001"
   ```

   For the included Docker database, start PostgreSQL from the repository root with `docker compose up -d postgres`. Its default credentials match the connection string above. Set `POSTGRES_PASSWORD` in the root environment if you use a different password.

3. Apply the Prisma schema:

   ```bash
   pnpm db:push
   ```

4. Start the web app:

   ```bash
   pnpm dev:web
   ```

   Open [http://localhost:3001](http://localhost:3001). The root page directs agents to the dashboard after login and other visitors to the login page. New agents can register from there.

## Useful commands

- `pnpm --filter web check-types` — check web TypeScript types.
- `pnpm --filter web build` — build the web app.
- `pnpm db:generate` — generate the Prisma client.
- `pnpm db:studio` — open Prisma Studio.
- `docker compose down` — stop the local services.

The Next.js app is in `apps/web`, the Prisma schema and client are in `packages/db`, and shared UI styles are in `packages/ui`.
