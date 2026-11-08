import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const connectionString = process.env.QUERY_TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Set QUERY_TEST_DATABASE_URL to the PostgreSQL database to test",
  );
}

const source = await readFile(
  fileURLToPath(new URL("../query-table.sql", import.meta.url)),
  "utf8",
);
const statements = new Map();
const labels = [...source.matchAll(/^-- (Q\d+\.\d+)\s*$/gm)];
for (const [index, match] of labels.entries()) {
  const section = source.slice(
    match.index + match[0].length,
    labels[index + 1]?.index,
  );
  statements.set(match[1], `${section.split(";")[0].trim()};`);
}
if (statements.size !== 31) {
  throw new Error(
    `Expected 31 query-table statements, found ${statements.size}`,
  );
}

const client = new pg.Client({ connectionString });
await client.connect();
const executed = [];
async function run(id, values = [], minRows = 1) {
  const sql = statements.get(id);
  if (!sql) throw new Error(`Missing ${id}`);
  const result = await client.query(sql, values);
  if (result.rowCount < minRows) {
    throw new Error(
      `${id} returned ${result.rowCount} rows; expected at least ${minRows}`,
    );
  }
  executed.push(id);
  return result.rows[0];
}

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
const username = `q${suffix}`;
const phone = `08${suffix.replaceAll(/\D/g, "").padEnd(8, "0").slice(0, 8)}`;
const start = new Date(Date.now() + 86_400_000);
const end = new Date(start.getTime() + 3_600_000);

try {
  await client.query("BEGIN");
  await run("Q1.1", [username], 0);
  const user = await run("Q1.2", [username, "query-test-hash"]);
  const userId = user.id;
  await run("Q1.1", [username]);
  await run("Q2.1", [username]);
  const owner = await run("Q3.2", [userId, "Query Test Owner", phone]);
  const ownerId = owner.id;
  const property = await run("Q3.3", [
    userId,
    ownerId,
    "Query Test Property",
    "house",
    "Test address",
    75,
    1000000,
    "Query verification",
  ]);
  const propertyId = property.id;
  await run("Q3.5", [propertyId, "Listing", 1]);
  const check = await run("Q3.6", [propertyId, "DDproperty"]);
  const checkId = check.id;
  const buyer = await run("Q6.2", [
    userId,
    "Query Test Buyer",
    `09${phone.slice(2)}`,
    "Test",
    null,
    null,
  ]);
  const buyerId = buyer.id;

  await run("Q3.1", [userId]);
  await run("Q3.4", [userId, phone]);
  await run("Q4.1", [userId]);
  await run("Q4.2", [userId, propertyId]);
  await run("Q4.4", [userId, propertyId]);
  await run("Q4.3", [true, start, checkId, propertyId, userId]);
  await run("Q5.4", [userId]);
  await run("Q5.5", [userId]);
  await run("Q5.6", [userId]);
  await run("Q5.7", [userId]);
  await run("Q5.2", [userId, start, end, null], 0);
  const appointment = await run("Q5.3", [
    userId,
    ownerId,
    buyerId,
    propertyId,
    "ดูอสังหา",
    start,
    end,
    "Query verification",
  ]);
  const appointmentId = appointment.id;
  await run("Q5.2", [userId, start, end, null]);
  await run("Q5.1", [userId, start, end]);
  await run("Q5.8", [start, end, "เสร็จสิ้น", "Done", appointmentId, userId]);
  await run("Q6.1", [userId, null]);
  await run("Q6.1", [userId, `09${phone.slice(2)}`]);
  await run("Q7.1", [userId]);
  await run("Q7.2", [userId, "ว่าง"]);
  await run("Q7.3", [userId]);
  await run("Q7.4", [userId, "ว่าง"]);
  await run("Q8.1", [userId]);
  await run("Q8.4", [propertyId, userId]);
  await run("Q8.2", ["กำลังดำเนินการ", propertyId, userId, "ว่าง"]);
  await run("Q8.3", [propertyId, userId, "ว่าง", "กำลังดำเนินการ"]);

  if (new Set(executed).size !== statements.size) {
    throw new Error(
      `Executed ${new Set(executed).size} of ${statements.size} queries`,
    );
  }
  console.log(`Passed ${executed.length} queries: ${executed.join(", ")}`);
} finally {
  try {
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}
