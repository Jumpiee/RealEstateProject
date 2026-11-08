import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const guide = await readFile(new URL("../../../Prisma_DB_Guide_and_Original_Usecase_SQL.md", import.meta.url), "utf8");
const section = guide.slice(guide.indexOf("## Original SQL commands"));
const expected = new Map();
for (const match of section.matchAll(/#### (Q[1-8]\.\d+)\s*\r?\n\s*```sql\r?\n([\s\S]*?)\r?\n```/g)) expected.set(match[1], match[2]);
if (expected.size !== 31) throw new Error(`Expected 31 guide commands, found ${expected.size}`);

const catalog = await readFile(fileURLToPath(new URL("../src/usecase-query-catalog.ts", import.meta.url)), "utf8");
const actual = new Map();
for (const match of catalog.matchAll(/"(Q[1-8]\.\d+)": ("(?:\\.|[^"\\])*")/g)) actual.set(match[1], JSON.parse(match[2]));
if (actual.size !== 31) throw new Error(`Expected 31 registry commands, found ${actual.size}`);
for (const [id, sql] of expected) {
  if (actual.get(id) !== sql) throw new Error(`${id} differs from the guide SQL`);
}

const queryTable = (await readFile(new URL("../query-table.sql", import.meta.url), "utf8")).replace(/^\uFEFF/, "");
const labels = [...queryTable.matchAll(/^-- (Q[1-8]\.\d+)\s*$/gm)];
if (labels.length !== 31) throw new Error(`Expected 31 query-table labels, found ${labels.length}`);
for (const [index, label] of labels.entries()) {
  const start = label.index + label[0].length;
  const end = labels[index + 1]?.index ?? queryTable.length;
  let content = queryTable.slice(start, end).replace(/^\r?\n/, "");
  while (content.endsWith("\r\n")) content = content.slice(0, -2);
  while (content.endsWith("\n")) content = content.slice(0, -1);
  if (content !== expected.get(label[1])) throw new Error(`${label[1]} differs from the guide SQL in query-table.sql: ${JSON.stringify(content)} !== ${JSON.stringify(expected.get(label[1]))}`);
}
console.log("Verified all 31 catalogue strings byte-for-byte against the guide.");
