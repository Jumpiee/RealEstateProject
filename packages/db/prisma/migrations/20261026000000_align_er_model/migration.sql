-- Additive alignment for databases created with `prisma db push` before
-- migration history was introduced. Existing physical tables and legacy
-- columns remain in place so stored records stay readable.

ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "budget" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "income" DECIMAL(18,2);

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

ALTER TABLE "PropertyPosting"
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Preserve the old text status and postedAt columns, while copying their
-- clear equivalents into the new boolean/date fields used by PublicationCheck.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PropertyPosting"
    WHERE "status" IS NULL
       OR "status" NOT IN ('ลงแล้ว', 'ยังไม่ลง')
  ) THEN
    RAISE EXCEPTION 'Cannot backfill PublicationCheck: PropertyPosting contains an unknown status';
  END IF;
END $$;

UPDATE "PropertyPosting"
SET "isPublished" = ("status" = 'ลงแล้ว'),
    "publishedAt" = "postedAt";

ALTER TABLE "PropertyPosting"
  ALTER COLUMN "isPublished" DROP DEFAULT;

-- Existing history has propertyId and each property identifies its managing
-- agent. Backfill changedBy from that owner relationship before making it
-- required; the history rows and statuses are otherwise untouched.
ALTER TABLE "PropertyStatusHistory"
  ADD COLUMN IF NOT EXISTS "changedBy" TEXT;

UPDATE "PropertyStatusHistory" AS history
SET "changedBy" = property."agentId"
FROM "Property" AS property
WHERE history."propertyId" = property."id"
  AND history."changedBy" IS NULL;

ALTER TABLE "PropertyStatusHistory"
  ALTER COLUMN "changedBy" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "PropertyTask" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "stepName" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PropertyTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PropertyTask_propertyId_stepOrder_idx"
  ON "PropertyTask"("propertyId", "stepOrder");

CREATE INDEX IF NOT EXISTS "Appointment_ownerId_idx"
  ON "Appointment"("ownerId");

CREATE INDEX IF NOT EXISTS "Appointment_customerId_idx"
  ON "Appointment"("customerId");

CREATE INDEX IF NOT EXISTS "Appointment_propertyId_idx"
  ON "Appointment"("propertyId");

CREATE INDEX IF NOT EXISTS "PropertyStatusHistory_changedBy_idx"
  ON "PropertyStatusHistory"("changedBy");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Appointment_ownerId_fkey'
      AND conrelid = '"Appointment"'::regclass
  ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "Owner"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyTask_propertyId_fkey'
      AND conrelid = '"PropertyTask"'::regclass
  ) THEN
    ALTER TABLE "PropertyTask"
      ADD CONSTRAINT "PropertyTask_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PropertyStatusHistory_changedBy_fkey'
      AND conrelid = '"PropertyStatusHistory"'::regclass
  ) THEN
    ALTER TABLE "PropertyStatusHistory"
      ADD CONSTRAINT "PropertyStatusHistory_changedBy_fkey"
      FOREIGN KEY ("changedBy") REFERENCES "Agent"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Protect persisted business records from deletion through their managing
-- user/property. The session relation remains cascading infrastructure.
ALTER TABLE "Owner" DROP CONSTRAINT IF EXISTS "Owner_agentId_fkey";
ALTER TABLE "Owner"
  ADD CONSTRAINT "Owner_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_agentId_fkey";
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_agentId_fkey";
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_agentId_fkey";
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyPosting" DROP CONSTRAINT IF EXISTS "PropertyPosting_propertyId_fkey";
ALTER TABLE "PropertyPosting"
  ADD CONSTRAINT "PropertyPosting_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyStatusHistory" DROP CONSTRAINT IF EXISTS "PropertyStatusHistory_propertyId_fkey";
ALTER TABLE "PropertyStatusHistory"
  ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
