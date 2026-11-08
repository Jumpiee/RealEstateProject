-- New DDL for the guide's eight-table contract. The old text-key tables are
-- retained intact under legacy_* names as a recovery/audit copy. IDs are
-- assigned deterministically by the sorted legacy text ID and all relations
-- are remapped through temporary lookup tables. No legacy row is deleted.
BEGIN;

DO $$
BEGIN
  IF to_regclass('"Agent"') IS NULL OR to_regclass('"Owner"') IS NULL
     OR to_regclass('"Property"') IS NULL OR to_regclass('"Customer"') IS NULL
     OR to_regclass('"Appointment"') IS NULL OR to_regclass('"PropertyPosting"') IS NULL
     OR to_regclass('"PropertyTask"') IS NULL OR to_regclass('"PropertyStatusHistory"') IS NULL THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: expected legacy tables are missing';
  END IF;
  IF to_regclass('"legacy_agent"') IS NOT NULL OR to_regclass('"legacy_owner"') IS NOT NULL
     OR to_regclass('"legacy_property"') IS NOT NULL OR to_regclass('"legacy_customer"') IS NOT NULL
     OR to_regclass('"legacy_appointment"') IS NOT NULL OR to_regclass('"legacy_property_posting"') IS NOT NULL
     OR to_regclass('"legacy_property_task"') IS NOT NULL OR to_regclass('"legacy_property_status_history"') IS NOT NULL THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: legacy archive table name already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM "Agent" WHERE username !~ '^[a-z0-9_]{3,50}$'
      OR length(username) > 50 OR length("passwordHash") NOT BETWEEN 20 AND 255) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: invalid username or password hash in Agent';
  END IF;
  IF EXISTS (SELECT 1 FROM "Owner" WHERE btrim(name) = '' OR length(name) > 150 OR phone !~ '^[0-9]{10}$')
     OR EXISTS (SELECT 1 FROM "Customer" WHERE btrim(name) = '' OR length(name) > 150 OR phone !~ '^[0-9]{10}$') THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: owner/buyer name or phone cannot satisfy the documented constraints';
  END IF;
  IF EXISTS (SELECT 1 FROM "Property" WHERE btrim(name) = '' OR length(name) > 150 OR btrim(address) = ''
      OR type NOT IN ('house','condo','townhouse','land') OR length(type) > 50 OR area <= 0 OR price <= 0
      OR status NOT IN ('available','in_progress','sold','ว่าง','กำลังดำเนินการ','ขายแล้ว')) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: property has unmappable type, status, or invalid required value';
  END IF;
  IF EXISTS (SELECT 1 FROM "Appointment" WHERE "customerId" IS NULL OR "propertyId" IS NULL
      OR "startAt" IS NULL OR "endAt" <= "startAt"
      OR type NOT IN ('viewing','transfer','ดูอสังหา','ไปกรมที่ดิน')
      OR length(type) > 20 OR status NOT IN ('scheduled','completed','cancelled','นัดแล้ว','เสร็จสิ้น','ยกเลิก')
      OR length(status) > 20) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: appointment is missing required buyer/property or has unmappable type/status/time';
  END IF;
  IF EXISTS (SELECT 1 FROM "Appointment" a JOIN "Customer" b ON b.id=a."customerId"
       JOIN "Property" p ON p.id=a."propertyId"
       WHERE a."agentId" <> b."agentId" OR a."agentId" <> p."agentId") THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: appointment buyer/property belongs to another agent';
  END IF;
  IF EXISTS (SELECT 1 FROM "PropertyPosting" WHERE website IS NULL OR btrim(website) = ''
      OR status NOT IN ('ลงแล้ว','ยังไม่ลง') OR (status = 'ลงแล้ว' AND "postedAt" IS NULL)
      OR (status = 'ยังไม่ลง' AND "postedAt" IS NOT NULL)) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: publication status/date cannot be mapped';
  END IF;
  IF EXISTS (SELECT 1 FROM "PropertyTask" WHERE btrim("stepName") = '' OR length("stepName") > 100 OR "stepOrder" <= 0)
     OR EXISTS (SELECT 1 FROM "PropertyStatusHistory" WHERE "oldStatus" NOT IN ('available','in_progress','sold','ว่าง','กำลังดำเนินการ','ขายแล้ว')
       OR "newStatus" NOT IN ('available','in_progress','sold','ว่าง','กำลังดำเนินการ','ขายแล้ว')
       OR NOT (("oldStatus" IN ('available','ว่าง') AND "newStatus" IN ('in_progress','กำลังดำเนินการ'))
         OR ("oldStatus" IN ('in_progress','กำลังดำเนินการ') AND "newStatus" IN ('available','ว่าง','sold','ขายแล้ว')))) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: task/history contains an unmappable value';
  END IF;
  IF EXISTS (SELECT 1 FROM "Property" p JOIN "Owner" o ON o.id = p."ownerId" WHERE p."agentId" <> o."agentId")
     OR EXISTS (SELECT 1 FROM "Appointment" a JOIN "Property" p ON p.id = a."propertyId"
        WHERE a."ownerId" IS NOT NULL AND a."ownerId" <> p."ownerId") THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: cross-account owner/property relationship found';
  END IF;
  IF EXISTS (SELECT 1 FROM "Customer" WHERE budget < 0 OR income < 0)
     OR EXISTS (SELECT 1 FROM "Property" WHERE price < 0) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: negative amount cannot be migrated';
  END IF;
  IF EXISTS (SELECT 1 FROM "Property" WHERE area >= 10000000000 OR price >= 1000000000000
      OR area <> round(area::numeric,2) OR price <> round(price::numeric,2))
     OR EXISTS (SELECT 1 FROM "Customer" WHERE budget >= 1000000000000 OR income >= 10000000000
      OR budget IS NOT NULL AND budget <> round(budget,2) OR income IS NOT NULL AND income <> round(income,2)) THEN
    RAISE EXCEPTION 'Schema alignment preflight failed: numeric value exceeds documented precision or would require rounding';
  END IF;
END $$;

-- Keep the original tables, all unmapped legacy columns, and session records.
ALTER TABLE "Agent" RENAME TO "legacy_agent";
ALTER TABLE "Owner" RENAME TO "legacy_owner";
ALTER TABLE "Property" RENAME TO "legacy_property";
ALTER TABLE "Customer" RENAME TO "legacy_customer";
ALTER TABLE "Appointment" RENAME TO "legacy_appointment";
ALTER TABLE "PropertyPosting" RENAME TO "legacy_property_posting";
ALTER TABLE "PropertyTask" RENAME TO "legacy_property_task";
ALTER TABLE "PropertyStatusHistory" RENAME TO "legacy_property_status_history";

-- Persist the exact CUID-to-BIGINT correspondence in each source archive.
ALTER TABLE "legacy_agent" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_owner" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_property" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_customer" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_appointment" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_property_task" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_property_posting" ADD COLUMN "_migration_new_id" bigint UNIQUE;
ALTER TABLE "legacy_property_status_history" ADD COLUMN "_migration_new_id" bigint UNIQUE;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_agent")
UPDATE "legacy_agent" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_owner")
UPDATE "legacy_owner" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_property")
UPDATE "legacy_property" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_customer")
UPDATE "legacy_customer" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_appointment")
UPDATE "legacy_appointment" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_property_task")
UPDATE "legacy_property_task" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_property_posting")
UPDATE "legacy_property_posting" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;
WITH ids AS (SELECT id,row_number() OVER (ORDER BY id)::bigint AS new_id FROM "legacy_property_status_history")
UPDATE "legacy_property_status_history" a SET "_migration_new_id"=ids.new_id FROM ids WHERE ids.id=a.id;

CREATE TEMP TABLE _user_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _owner_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _property_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _buyer_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _appointment_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _task_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _publication_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE _history_ids(old_id text PRIMARY KEY, new_id bigint UNIQUE NOT NULL) ON COMMIT DROP;

INSERT INTO _user_ids SELECT id, "_migration_new_id" FROM "legacy_agent";
INSERT INTO _owner_ids SELECT id, "_migration_new_id" FROM "legacy_owner";
INSERT INTO _property_ids SELECT id, "_migration_new_id" FROM "legacy_property";
INSERT INTO _buyer_ids SELECT id, "_migration_new_id" FROM "legacy_customer";
INSERT INTO _appointment_ids SELECT id, "_migration_new_id" FROM "legacy_appointment";
INSERT INTO _task_ids SELECT id, "_migration_new_id" FROM "legacy_property_task";
INSERT INTO _publication_ids SELECT id, "_migration_new_id" FROM "legacy_property_posting";
INSERT INTO _history_ids SELECT id, "_migration_new_id" FROM "legacy_property_status_history";

CREATE TABLE "user" (
  user_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  CONSTRAINT user_username_ck CHECK (username ~ '^[a-z0-9_]{3,50}$'),
  CONSTRAINT user_password_hash_ck CHECK (length(password_hash) BETWEEN 20 AND 255)
);
CREATE TABLE owner (
  owner_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL CONSTRAINT owner_user_id_fkey REFERENCES "user"(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name varchar(150) NOT NULL,
  phone varchar(10) NOT NULL,
  CONSTRAINT owner_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT owner_phone_ck CHECK (phone ~ '^[0-9]{10}$'),
  CONSTRAINT owner_id_user_id_uq UNIQUE(owner_id,user_id)
);
CREATE INDEX owner_user_id_idx ON owner(user_id);
CREATE TABLE property (
  property_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL CONSTRAINT property_user_id_fkey REFERENCES "user"(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  owner_id bigint NOT NULL,
  name varchar(150) NOT NULL,
  type varchar(50) NOT NULL,
  address text NOT NULL,
  area numeric(12,2) NOT NULL,
  price numeric(14,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'available',
  description text,
  CONSTRAINT property_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT property_type_ck CHECK (type IN ('house','condo','townhouse','land')),
  CONSTRAINT property_address_ck CHECK (btrim(address) <> ''),
  CONSTRAINT property_area_ck CHECK (area > 0),
  CONSTRAINT property_price_ck CHECK (price > 0),
  CONSTRAINT property_status_ck CHECK (status IN ('available','in_progress','sold')),
  CONSTRAINT property_owner_id_user_id_fkey FOREIGN KEY(owner_id,user_id) REFERENCES owner(owner_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT property_id_user_id_uq UNIQUE(property_id,user_id),
  CONSTRAINT property_id_owner_id_user_id_uq UNIQUE(property_id,owner_id,user_id)
);
CREATE INDEX property_user_id_idx ON property(user_id);
CREATE INDEX property_owner_user_id_idx ON property(owner_id,user_id);
CREATE TABLE buyer (
  buyer_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL CONSTRAINT buyer_user_id_fkey REFERENCES "user"(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name varchar(150) NOT NULL,
  phone varchar(10) NOT NULL,
  requirements text,
  budget numeric(14,2),
  income numeric(12,2),
  CONSTRAINT buyer_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT buyer_phone_ck CHECK (phone ~ '^[0-9]{10}$'),
  CONSTRAINT buyer_budget_ck CHECK (budget IS NULL OR budget >= 0),
  CONSTRAINT buyer_income_ck CHECK (income IS NULL OR income >= 0),
  CONSTRAINT buyer_id_user_id_uq UNIQUE(buyer_id,user_id)
);
CREATE INDEX buyer_user_id_idx ON buyer(user_id);
CREATE TABLE appointment (
  appointment_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL CONSTRAINT appointment_user_id_fkey REFERENCES "user"(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  owner_id bigint,
  buyer_id bigint NOT NULL,
  property_id bigint NOT NULL,
  appointment_type varchar(20) NOT NULL,
  appointment_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'scheduled',
  details text,
  CONSTRAINT appointment_type_ck CHECK (appointment_type IN ('viewing','transfer')),
  CONSTRAINT appointment_status_ck CHECK (status IN ('scheduled','completed','cancelled')),
  CONSTRAINT appointment_time_ck CHECK (end_at > appointment_at),
  CONSTRAINT appointment_buyer_id_user_id_fkey FOREIGN KEY(buyer_id,user_id) REFERENCES buyer(buyer_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT appointment_property_id_user_id_fkey FOREIGN KEY(property_id,user_id) REFERENCES property(property_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT appointment_property_id_owner_id_user_id_fkey FOREIGN KEY(property_id,owner_id,user_id) REFERENCES property(property_id,owner_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT appointment_owner_id_user_id_fkey FOREIGN KEY(owner_id,user_id) REFERENCES owner(owner_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX appointment_user_start_idx ON appointment(user_id,appointment_at);
CREATE INDEX appointment_user_end_idx ON appointment(user_id,end_at);
CREATE INDEX appointment_buyer_user_idx ON appointment(buyer_id,user_id);
CREATE INDEX appointment_property_user_idx ON appointment(property_id,user_id);
CREATE INDEX appointment_owner_user_idx ON appointment(owner_id,user_id);
CREATE TABLE property_task (
  task_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  property_id bigint NOT NULL CONSTRAINT property_task_property_id_fkey REFERENCES property(property_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  step_name varchar(100) NOT NULL,
  step_order integer NOT NULL,
  CONSTRAINT property_task_step_name_ck CHECK (btrim(step_name) <> ''),
  CONSTRAINT property_task_step_order_ck CHECK (step_order > 0),
  CONSTRAINT property_task_property_step_uq UNIQUE(property_id,step_order)
);
CREATE INDEX property_task_property_idx ON property_task(property_id);
CREATE TABLE publication_check (
  publication_check_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  property_id bigint NOT NULL CONSTRAINT publication_check_property_id_fkey REFERENCES property(property_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  website_name varchar(100) NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  CONSTRAINT publication_website_ck CHECK (btrim(website_name) <> ''),
  CONSTRAINT publication_state_ck CHECK ((is_published AND published_at IS NOT NULL) OR (NOT is_published AND published_at IS NULL)),
  CONSTRAINT publication_property_website_uq UNIQUE(property_id,website_name)
);
CREATE INDEX publication_property_idx ON publication_check(property_id);
CREATE TABLE property_status_history (
  history_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  property_id bigint NOT NULL CONSTRAINT property_status_history_property_id_fkey REFERENCES property(property_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  changed_by bigint NOT NULL CONSTRAINT property_status_history_changed_by_fkey REFERENCES "user"(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  old_status varchar(20) NOT NULL,
  new_status varchar(20) NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT history_old_status_ck CHECK (old_status IN ('available','in_progress','sold')),
  CONSTRAINT history_new_status_ck CHECK (new_status IN ('available','in_progress','sold')),
  CONSTRAINT history_transition_ck CHECK ((old_status='available' AND new_status='in_progress') OR (old_status='in_progress' AND new_status IN ('available','sold'))),
  CONSTRAINT property_status_history_property_id_changed_by_fkey FOREIGN KEY(property_id,changed_by) REFERENCES property(property_id,user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX history_property_idx ON property_status_history(property_id);
CREATE INDEX history_changed_by_idx ON property_status_history(changed_by);

INSERT INTO "user"(user_id,username,password_hash)
SELECT m.new_id,a.username,a."passwordHash" FROM "legacy_agent" a JOIN _user_ids m ON m.old_id=a.id;
INSERT INTO owner(owner_id,user_id,name,phone)
SELECT om.new_id,um.new_id,o.name,o.phone FROM "legacy_owner" o JOIN _owner_ids om ON om.old_id=o.id JOIN _user_ids um ON um.old_id=o."agentId";
INSERT INTO property(property_id,user_id,owner_id,name,type,address,area,price,status,description)
SELECT pm.new_id,um.new_id,om.new_id,p.name,p.type,p.address,p.area::numeric(12,2),p.price::numeric(14,2),
  CASE p.status WHEN 'ว่าง' THEN 'available' WHEN 'กำลังดำเนินการ' THEN 'in_progress' WHEN 'ขายแล้ว' THEN 'sold' ELSE p.status END,p.description
FROM "legacy_property" p JOIN _property_ids pm ON pm.old_id=p.id JOIN _user_ids um ON um.old_id=p."agentId" JOIN _owner_ids om ON om.old_id=p."ownerId";
INSERT INTO buyer(buyer_id,user_id,name,phone,requirements,budget,income)
SELECT bm.new_id,um.new_id,b.name,b.phone,b.requirements,b.budget::numeric(14,2),b.income::numeric(12,2)
FROM "legacy_customer" b JOIN _buyer_ids bm ON bm.old_id=b.id JOIN _user_ids um ON um.old_id=b."agentId";
INSERT INTO appointment(appointment_id,user_id,owner_id,buyer_id,property_id,appointment_type,appointment_at,end_at,status,details)
SELECT am.new_id,um.new_id,om.new_id,bm.new_id,pm.new_id,
  CASE a.type WHEN 'ดูอสังหา' THEN 'viewing' WHEN 'ไปกรมที่ดิน' THEN 'transfer' ELSE a.type END,
  a."startAt" AT TIME ZONE 'UTC',a."endAt" AT TIME ZONE 'UTC',
  CASE a.status WHEN 'นัดแล้ว' THEN 'scheduled' WHEN 'เสร็จสิ้น' THEN 'completed' WHEN 'ยกเลิก' THEN 'cancelled' ELSE a.status END,a.details
FROM "legacy_appointment" a JOIN _appointment_ids am ON am.old_id=a.id JOIN _user_ids um ON um.old_id=a."agentId"
JOIN _buyer_ids bm ON bm.old_id=a."customerId" JOIN _property_ids pm ON pm.old_id=a."propertyId"
LEFT JOIN _owner_ids om ON om.old_id=a."ownerId";
INSERT INTO property_task(task_id,property_id,step_name,step_order)
SELECT tm.new_id,pm.new_id,t."stepName",t."stepOrder" FROM "legacy_property_task" t JOIN _task_ids tm ON tm.old_id=t.id JOIN _property_ids pm ON pm.old_id=t."propertyId";
INSERT INTO publication_check(publication_check_id,property_id,website_name,is_published,published_at)
SELECT cm.new_id,pm.new_id,c.website,c.status='ลงแล้ว',CASE WHEN c.status='ลงแล้ว' THEN c."postedAt" AT TIME ZONE 'UTC' ELSE NULL END
FROM "legacy_property_posting" c JOIN _publication_ids cm ON cm.old_id=c.id JOIN _property_ids pm ON pm.old_id=c."propertyId";
INSERT INTO property_status_history(history_id,property_id,changed_by,old_status,new_status,changed_at)
SELECT hm.new_id,pm.new_id,um.new_id,
  CASE h."oldStatus" WHEN 'ว่าง' THEN 'available' WHEN 'กำลังดำเนินการ' THEN 'in_progress' WHEN 'ขายแล้ว' THEN 'sold' ELSE h."oldStatus" END,
  CASE h."newStatus" WHEN 'ว่าง' THEN 'available' WHEN 'กำลังดำเนินการ' THEN 'in_progress' WHEN 'ขายแล้ว' THEN 'sold' ELSE h."newStatus" END,
  h."changedAt" AT TIME ZONE 'UTC'
FROM "legacy_property_status_history" h JOIN _history_ids hm ON hm.old_id=h.id JOIN _property_ids pm ON pm.old_id=h."propertyId" JOIN _user_ids um ON um.old_id=h."changedBy";

-- Explicitly advance identity sequences beyond the backfilled IDs.
SELECT setval(pg_get_serial_sequence('"user"','user_id'), COALESCE((SELECT max(user_id) FROM "user"),1), true);
SELECT setval(pg_get_serial_sequence('owner','owner_id'), COALESCE((SELECT max(owner_id) FROM owner),1), true);
SELECT setval(pg_get_serial_sequence('property','property_id'), COALESCE((SELECT max(property_id) FROM property),1), true);
SELECT setval(pg_get_serial_sequence('buyer','buyer_id'), COALESCE((SELECT max(buyer_id) FROM buyer),1), true);
SELECT setval(pg_get_serial_sequence('appointment','appointment_id'), COALESCE((SELECT max(appointment_id) FROM appointment),1), true);
SELECT setval(pg_get_serial_sequence('property_task','task_id'), COALESCE((SELECT max(task_id) FROM property_task),1), true);
SELECT setval(pg_get_serial_sequence('publication_check','publication_check_id'), COALESCE((SELECT max(publication_check_id) FROM publication_check),1), true);
SELECT setval(pg_get_serial_sequence('property_status_history','history_id'), COALESCE((SELECT max(history_id) FROM property_status_history),1), true);
DO $$
BEGIN
  IF (SELECT count(*) FROM "legacy_agent") <> (SELECT count(*) FROM "user")
    OR (SELECT count(*) FROM "legacy_owner") <> (SELECT count(*) FROM owner)
    OR (SELECT count(*) FROM "legacy_property") <> (SELECT count(*) FROM property)
    OR (SELECT count(*) FROM "legacy_customer") <> (SELECT count(*) FROM buyer)
    OR (SELECT count(*) FROM "legacy_appointment") <> (SELECT count(*) FROM appointment)
    OR (SELECT count(*) FROM "legacy_property_task") <> (SELECT count(*) FROM property_task)
    OR (SELECT count(*) FROM "legacy_property_posting") <> (SELECT count(*) FROM publication_check)
    OR (SELECT count(*) FROM "legacy_property_status_history") <> (SELECT count(*) FROM property_status_history) THEN
    RAISE EXCEPTION 'Schema alignment failed row-count verification; all changes rolled back';
  END IF;
END $$;
COMMIT;
