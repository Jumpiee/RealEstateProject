import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const connectionString = process.env.QUERY_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Set QUERY_TEST_DATABASE_URL to an isolated PostgreSQL database");
const source = (await readFile(fileURLToPath(new URL("../query-table.sql", import.meta.url)), "utf8")).replace(/^\uFEFF/, "");
const statements = new Map();
const labels = [...source.matchAll(/^-- (Q\d+\.\d+)\s*$/gm)];
for (const [index, label] of labels.entries()) {
  let sql = source.slice(label.index + label[0].length, labels[index + 1]?.index ?? source.length).replace(/^\r?\n/, "");
  while (sql.endsWith("\r\n")) sql = sql.slice(0, -2);
  while (sql.endsWith("\n")) sql = sql.slice(0, -1);
  statements.set(label[1], sql);
}
if (statements.size !== 31) throw new Error(`Expected 31 statements, found ${statements.size}`);

const client = new pg.Client({ connectionString });
await client.connect();
const executed = new Set();
async function run(id, values = [], expectedRows = 1) {
  const result = await client.query(statements.get(id), values);
  if (result.rowCount < expectedRows) throw new Error(`${id} returned ${result.rowCount} rows`);
  executed.add(id); return result.rows[0];
}

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
const username = `q${suffix}`;
const phone = `08${suffix.replaceAll(/\D/g, "").padEnd(8, "0").slice(0, 8)}`;
const start = new Date(Date.now() + 86_400_000);
const end = new Date(start.getTime() + 3_600_000);
try {
  await client.query("BEGIN");
  await run("Q1.1", [username], 0);
  const user = await run("Q1.2", [username, "scrypt$test$01234567890123456789012345678901"]);
  const userId = user.user_id;
  await run("Q1.1", [username]); await run("Q2.1", [username]);
  const owner = await run("Q3.2", [userId, "Query Test Owner", phone]);
  const property = await run("Q3.3", [userId, owner.owner_id, "Query Test Property", "house", "Test address", "75.25", "1000000.50", "Query verification"]);
  const propertyId = property.property_id;
  await run("Q3.5", [propertyId, "Listing", 1]);
  const publication = await run("Q3.6", [propertyId, "DDproperty"]);
  const buyer = await run("Q6.2", [userId, "Query Test Buyer", `09${phone.slice(2)}`, "Test", null, null]);
  const buyerId = buyer.buyer_id;

  await run("Q3.1", [userId]); await run("Q3.4", [userId, phone]);
  await run("Q4.1", [userId]); await run("Q4.2", [userId, propertyId]); await run("Q4.4", [userId, propertyId]);
  await run("Q4.3", [true, start, publication.publication_check_id, propertyId, userId]);
  await run("Q5.4", [userId]); await run("Q5.5", [userId]); await run("Q5.6", [userId]); await run("Q5.7", [userId]);
  await run("Q5.2", [userId, start, end, null], 0);
  const appointment = await run("Q5.3", [userId, owner.owner_id, buyerId, propertyId, "viewing", start, end, "Query verification"]);
  await run("Q5.2", [userId, start, end, null]); await run("Q5.1", [userId, start, end]);
  await run("Q5.8", [start, end, "completed", "Done", appointment.appointment_id, userId]);
  await run("Q6.1", [userId, null]); await run("Q6.1", [userId, `09${phone.slice(2)}`]);
  await run("Q7.1", [userId]); await run("Q7.2", [userId, "available"]); await run("Q7.3", [userId]); await run("Q7.4", [userId, "available"]);
  await run("Q8.1", [userId]); await run("Q8.4", [propertyId, userId]);
  await run("Q8.2", ["in_progress", propertyId, userId, "available"]);
  await run("Q8.3", [propertyId, userId, "available", "in_progress"]);
  if (executed.size !== 31) throw new Error(`Executed ${executed.size} unique commands`);
  console.log(`Passed ${executed.size} guide queries on isolated PostgreSQL: ${[...executed].join(", ")}`);
} finally {
  try { await client.query("ROLLBACK"); } finally { await client.end(); }
}
