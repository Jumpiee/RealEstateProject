-- Keep legacy participant labels intact for existing appointments, while
-- allowing new appointments to rely on the nullable ownerId/buyerId relations.
ALTER TABLE "Appointment"
  ALTER COLUMN "relevantPerson" DROP NOT NULL;
