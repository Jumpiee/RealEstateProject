-- Q1.1
SELECT user_id FROM "user"
WHERE username = lower($1);

-- Q1.2
INSERT INTO "user" (username, password_hash)
VALUES (lower($1), $2)
RETURNING user_id;

-- Q2.1
SELECT user_id, username, password_hash
FROM "user" WHERE username = lower($1);

-- Q3.1
SELECT property_id, owner_id, name, type, address,
       area, price, status, description
FROM property WHERE user_id = $1
ORDER BY property_id DESC;

-- Q3.4
SELECT owner_id, name, phone
FROM owner WHERE user_id = $1 AND phone = $2
ORDER BY owner_id;

-- Q3.2
INSERT INTO owner (user_id, name, phone)
VALUES ($1, $2, $3) RETURNING owner_id;

-- Q3.3
INSERT INTO property
  (user_id, owner_id, name, type, address,
   area, price, description)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING property_id;

-- Q3.5
INSERT INTO property_task
  (property_id, step_name, step_order)
VALUES ($1, $2, $3) RETURNING task_id;

-- Q3.6
INSERT INTO publication_check
  (property_id, website_name)
VALUES ($1, $2) RETURNING publication_check_id;

-- Q4.1
SELECT property_id, name, status
FROM property WHERE user_id = $1
ORDER BY property_id DESC;

-- Q4.2
SELECT t.task_id, t.step_name, t.step_order
FROM property_task t
JOIN property p ON p.property_id = t.property_id
WHERE p.user_id = $1 AND p.property_id = $2
ORDER BY t.step_order;

-- Q4.4
SELECT c.publication_check_id, c.website_name,
       c.is_published, c.published_at
FROM publication_check c
JOIN property p ON p.property_id = c.property_id
WHERE p.user_id = $1 AND p.property_id = $2
ORDER BY c.website_name;

-- Q4.3
UPDATE publication_check SET
  is_published = $1, published_at = $2
WHERE publication_check_id = $3 AND property_id = $4
  AND property_id IN
    (SELECT property_id FROM property WHERE user_id = $5)
RETURNING publication_check_id;

-- Q5.1
SELECT appointment_id, owner_id, buyer_id, property_id,
       appointment_type, appointment_at, end_at, status, details
FROM appointment
WHERE user_id = $1 AND appointment_at < $3
  AND end_at > $2 ORDER BY appointment_at;

-- Q5.4
SELECT owner_id, name, phone FROM owner
WHERE user_id = $1 ORDER BY name;

-- Q5.5
SELECT buyer_id, name, phone FROM buyer
WHERE user_id = $1 ORDER BY name;

-- Q5.6
SELECT property_id, owner_id, name, status
FROM property WHERE user_id = $1 ORDER BY name;

-- Q5.7
SELECT pg_advisory_xact_lock($1::bigint);

-- Q5.2
SELECT appointment_id FROM appointment
WHERE user_id = $1 AND status = 'scheduled'
  AND appointment_at < $3 AND end_at > $2
  AND ($4::bigint IS NULL OR appointment_id <> $4);

-- Q5.3
INSERT INTO appointment
  (user_id, owner_id, buyer_id, property_id,
   appointment_type, appointment_at, end_at, details)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING appointment_id;

-- Q5.8
UPDATE appointment SET appointment_at = $1,
  end_at = $2, status = $3, details = $4
WHERE appointment_id = $5 AND user_id = $6
  AND status = 'scheduled'
RETURNING appointment_id;

-- Q6.1
SELECT buyer_id, name, phone, requirements, budget, income
FROM buyer WHERE user_id = $1
  AND ($2::varchar IS NULL OR phone = $2)
ORDER BY name;

-- Q6.2
INSERT INTO buyer
  (user_id, name, phone, requirements, budget, income)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING buyer_id;

-- Q7.1
SELECT property_id, name, type, address, price, status
FROM property WHERE user_id = $1 ORDER BY property_id;

-- Q7.2
SELECT property_id, name, type, address, price, status
FROM property WHERE user_id = $1
  AND ($2::varchar IS NULL OR status = $2)
ORDER BY property_id;

-- Q7.3
SELECT p.property_id, p.name, p.type, o.name AS owner_name,
       p.status, p.address, p.area, p.price, p.description
FROM property p JOIN owner o
  ON o.owner_id = p.owner_id AND o.user_id = p.user_id
WHERE p.user_id = $1
ORDER BY p.property_id DESC;

-- Q7.4
SELECT p.property_id, p.name, p.type, o.name AS owner_name,
       p.status, p.address, p.area, p.price, p.description
FROM property p JOIN owner o
  ON o.owner_id = p.owner_id AND o.user_id = p.user_id
WHERE p.user_id = $1
  AND ($2::varchar IS NULL OR p.status = $2)
ORDER BY p.property_id DESC;

-- Q8.1
SELECT property_id, name, status
FROM property WHERE user_id = $1 ORDER BY property_id;

-- Q8.4
SELECT property_id, status FROM property
WHERE property_id = $1 AND user_id = $2
FOR UPDATE;

-- Q8.2
UPDATE property SET status = $1
WHERE property_id = $2 AND user_id = $3 AND status = $4
RETURNING property_id;

-- Q8.3
INSERT INTO property_status_history
  (property_id, changed_by, old_status, new_status)
VALUES ($1, $2, $3, $4) RETURNING history_id;

