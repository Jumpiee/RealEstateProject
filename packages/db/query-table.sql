-- Adapted from the System Analysis query table to the current Prisma schema.
-- Physical names follow schema.prisma mappings (for example User -> Agent and Buyer -> Customer).
-- IDs are TEXT; raw inserts supply UUID text because Prisma's client-side CUID default is not run here.

-- Q1.1
SELECT "id"
FROM "Agent"
WHERE "username" = lower($1);

-- Q1.2
INSERT INTO "Agent" ("id", "username", "passwordHash", "updatedAt")
VALUES (gen_random_uuid()::text, lower($1), $2, CURRENT_TIMESTAMP)
RETURNING "id";

-- Q2.1
SELECT "id", "username", "passwordHash"
FROM "Agent"
WHERE "username" = lower($1);

-- Q3.1
SELECT "id", "ownerId", "name", "type", "address", "area", "price", "status", "description"
FROM "Property"
WHERE "agentId" = $1
ORDER BY "id" DESC;

-- Q3.4
SELECT "id", "name", "phone"
FROM "Owner"
WHERE "agentId" = $1 AND "phone" = $2
ORDER BY "id";

-- Q3.2
INSERT INTO "Owner" ("id", "agentId", "name", "phone")
VALUES (gen_random_uuid()::text, $1, $2, $3)
RETURNING "id";

-- Q3.3
INSERT INTO "Property" (
  "id", "agentId", "ownerId", "name", "type", "address", "area", "price", "description", "updatedAt"
)
VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
RETURNING "id";

-- Q3.5
INSERT INTO "PropertyTask" ("id", "propertyId", "stepName", "stepOrder", "status")
VALUES (gen_random_uuid()::text, $1, $2, $3, 'ยังไม่เริ่ม')
RETURNING "id";
-- Divergence: the document omits required PropertyTask.status; initialize new tasks as not started.

-- Q3.6
INSERT INTO "PropertyPosting" ("id", "propertyId", "website", "isPublished", "status")
VALUES (gen_random_uuid()::text, $1, $2, FALSE, 'ยังไม่ลง')
RETURNING "id";
-- Divergence: PublicationCheck maps to PropertyPosting and requires isPublished; initialize its legacy status in sync.

-- Q4.1
SELECT "id", "name", "status"
FROM "Property"
WHERE "agentId" = $1
ORDER BY "id" DESC;

-- Q4.2
SELECT t."id", t."stepName", t."stepOrder"
FROM "PropertyTask" AS t
JOIN "Property" AS p ON p."id" = t."propertyId"
WHERE p."agentId" = $1 AND p."id" = $2
ORDER BY t."stepOrder";

-- Q4.4
SELECT c."id", c."website", c."isPublished", c."publishedAt"
FROM "PropertyPosting" AS c
JOIN "Property" AS p ON p."id" = c."propertyId"
WHERE p."agentId" = $1 AND p."id" = $2
ORDER BY c."website";

-- Q4.3
UPDATE "PropertyPosting" AS c
SET "isPublished" = $1,
    "publishedAt" = $2,
    "status" = CASE WHEN $1 THEN 'ลงแล้ว' ELSE 'ยังไม่ลง' END,
    "postedAt" = CASE WHEN $1 THEN $2::timestamp ELSE NULL END
WHERE c."id" = $3
  AND c."propertyId" = $4
  AND c."propertyId" IN (
    SELECT p."id" FROM "Property" AS p WHERE p."agentId" = $5
  )
RETURNING c."id";
-- Divergence: also keep the retained legacy status/postedAt columns synchronized with the new publication fields.

-- Q5.1
SELECT "id", "ownerId", "customerId", "propertyId", "type", "startAt", "endAt", "status", "details"
FROM "Appointment"
WHERE "agentId" = $1 AND "startAt" < $3 AND "endAt" > $2
ORDER BY "startAt";

-- Q5.4
SELECT "id", "name", "phone"
FROM "Owner"
WHERE "agentId" = $1
ORDER BY "name";

-- Q5.5
SELECT "id", "name", "phone"
FROM "Customer"
WHERE "agentId" = $1
ORDER BY "name";

-- Q5.6
SELECT "id", "ownerId", "name", "status"
FROM "Property"
WHERE "agentId" = $1
ORDER BY "name";

-- Q5.7
SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0));
-- Divergence: hash a stable text lock key because entity IDs are TEXT rather than BIGINT.

-- Q5.2
SELECT "id"
FROM "Appointment"
WHERE "agentId" = $1
  AND "status" = 'นัดแล้ว'
  AND "startAt" < $3
  AND "endAt" > $2
  AND ($4::text IS NULL OR "id" <> $4);
-- Divergence: use the application's Thai scheduled status and a nullable TEXT appointment ID.

-- Q5.3
INSERT INTO "Appointment" (
  "id", "agentId", "ownerId", "customerId", "propertyId", "type", "startAt", "endAt", "details", "status"
)
VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, 'นัดแล้ว')
RETURNING "id";
-- Divergence: Appointment stores the buyer relation as customerId and initializes status to the application's Thai value.

-- Q5.8
UPDATE "Appointment"
SET "startAt" = $1, "endAt" = $2, "status" = $3, "details" = $4
WHERE "id" = $5 AND "agentId" = $6 AND "status" = 'นัดแล้ว'
RETURNING "id";

-- Q6.1
SELECT "id", "name", "phone", "requirements", "budget", "income"
FROM "Customer"
WHERE "agentId" = $1
  AND ($2::varchar IS NULL OR "phone" = $2)
ORDER BY "name";

-- Q6.2
INSERT INTO "Customer" ("id", "agentId", "name", "phone", "requirements", "budget", "income")
VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)
RETURNING "id";

-- Q7.1
SELECT "id", "name", "type", "address", "price", "status"
FROM "Property"
WHERE "agentId" = $1
ORDER BY "id";

-- Q7.2
SELECT "id", "name", "type", "address", "price", "status"
FROM "Property"
WHERE "agentId" = $1
  AND ($2::varchar IS NULL OR "status" = $2)
ORDER BY "id";

-- Q7.3
SELECT p."id", p."name", p."type", o."name" AS "ownerName",
       p."status", p."address", p."area", p."price", p."description"
FROM "Property" AS p
JOIN "Owner" AS o ON o."id" = p."ownerId" AND o."agentId" = p."agentId"
WHERE p."agentId" = $1
ORDER BY p."id" DESC;

-- Q7.4
SELECT p."id", p."name", p."type", o."name" AS "ownerName",
       p."status", p."address", p."area", p."price", p."description"
FROM "Property" AS p
JOIN "Owner" AS o ON o."id" = p."ownerId" AND o."agentId" = p."agentId"
WHERE p."agentId" = $1
  AND ($2::varchar IS NULL OR p."status" = $2)
ORDER BY p."id" DESC;

-- Q8.1
SELECT "id", "name", "status"
FROM "Property"
WHERE "agentId" = $1
ORDER BY "id";

-- Q8.4
SELECT "id", "status"
FROM "Property"
WHERE "id" = $1 AND "agentId" = $2
FOR UPDATE;

-- Q8.2
UPDATE "Property"
SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $2 AND "agentId" = $3 AND "status" = $4
RETURNING "id";

-- Q8.3
INSERT INTO "PropertyStatusHistory" ("id", "propertyId", "changedBy", "oldStatus", "newStatus")
VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
RETURNING "id";
