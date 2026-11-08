-- Deleting a property also removes its property-specific task, publication,
-- and status-history rows. Replacing these foreign keys preserves all current
-- rows; it only changes the behavior of future property deletions.
ALTER TABLE "PropertyTask"
  DROP CONSTRAINT IF EXISTS "PropertyTask_propertyId_fkey";
ALTER TABLE "PropertyTask"
  ADD CONSTRAINT "PropertyTask_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyPosting"
  DROP CONSTRAINT IF EXISTS "PropertyPosting_propertyId_fkey";
ALTER TABLE "PropertyPosting"
  ADD CONSTRAINT "PropertyPosting_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyStatusHistory"
  DROP CONSTRAINT IF EXISTS "PropertyStatusHistory_propertyId_fkey";
ALTER TABLE "PropertyStatusHistory"
  ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
