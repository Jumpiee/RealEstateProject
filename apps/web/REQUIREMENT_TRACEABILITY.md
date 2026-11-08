# ER alignment and use-case traceability

Reviewed against `requirement.md` and `AGENTS.md` on 2026-10-26. The separate
ER image mentioned by `AGENTS.md` was not present in the repository; its
written entity list is the schema contract used here. Results below describe
this change, not the historical checks from the previous version of this file.

## Schema mapping and migration

| ER entity | Prisma model / physical table | Old-to-new mapping |
|---|---|---|
| USER | `User` / `Agent` | Existing `id`, unique `username`, and `passwordHash` retained. `AgentSession` remains session infrastructure. |
| OWNER | `Owner` / `Owner` | `userId` maps to old `agentId`; multiple owners per agent. Phone remains text. |
| BUYER | `Buyer` / `Customer` | `userId` maps to `agentId`; nullable `budget` and `income` added. Multiple buyers per agent. |
| PROPERTY | `Property` / `Property` | `userId` maps to `agentId`; `ownerId` and all existing property data remain. |
| PROPERTY_STATUS_HISTORY | `PropertyStatusHistory` / same | Required `changedBy` references `User`; existing rows backfill from their property's agent. |
| APPOINTMENT | `Appointment` / same | `userId`, `buyerId`, and `appointmentType` map to `agentId`, `customerId`, and `type`; nullable `ownerId` added. The legacy `relevantPerson` column remains nullable to preserve existing values; new appointments omit it. |
| PROPERTY_TASK | `PropertyTask` / same | New table with property, step name/order, status, and nullable completion time. |
| PUBLICATION_CHECK | `PublicationCheck` / `PropertyPosting` | `websiteName` maps to `website`; `isPublished` and nullable `publishedAt` backfill from old `status`/`postedAt`. Legacy publication data is copied into the new columns; the business table exposes only the guide-defined fields. |

Physical table and ID names follow existing Prisma conventions. `Owner.userId`
and `Buyer.userId` refer to the managing agent, not accounts for those people.
No uniqueness constraint prevents an agent from managing multiple records.
The schema retains `Property.userId` and `ownerId`; appointment owner, buyer,
and property links remain nullable. Deleting a property cascades to its tasks,
publication checks, and status history. Linked appointments remain and their
property reference becomes null. Other business records use restrictive delete
behavior; nullable appointment links use `SET NULL`. Passwords remain scrypt
hashes, and phone numbers remain strings. Area uses Decimal(12,2), price and
budget use Decimal(14,2), and income uses Decimal(12,2).

`0000_init` is the prechange baseline for fresh databases. Existing databases
created with `db push` must mark it applied before deploying the additive
alignment migration. The migration stops on an unknown legacy publication
status instead of converting it silently. It retains the legacy status/date
columns and does not delete rows.

`20261026010000_cascade_property_children` changes only the three property-child
foreign keys. Run `pnpm.cmd --filter @RealEstateProject/db db:migrate:deploy`
after the ER alignment migration. It does not delete existing records.
On 2026-10-26, this migration was applied to the local PostgreSQL database.
A rolled-back transaction confirmed that deleting a test property removes its
task, publication check, and status history, while retaining its appointment
with a null property reference. Prisma schema validation and web type checking
passed. The authenticated browser delete flow was not exercised.

For optional buyer budget and income, blank input maps to null. Entered
amounts must be nonnegative, have at most two decimal places, and fit
Decimal(14,2) and Decimal(12,2), respectively. The documented use cases
provide no customer deletion workflow.

`20261026020000_appointment_relevant_person_legacy_optional` drops the
`NOT NULL` constraint on the old appointment participant column without
removing stored names. The user's later request removes that field from the
appointment form, validation, save action, and list. This supersedes UC5's
earlier free-text participant step; customer and property links remain optional.
The migration was applied to local PostgreSQL and the Prisma client regenerated.

## UC1–UC8 review

`Not verified` means the complete interactive use case was not exercised after this schema change; static code review and focused checks are stated separately.

| UC | Result | Goal, precondition, postcondition, main and alternative flow evidence |
|---|---|---|
| UC1 Register | Not verified | Registration validates normalized 3–50 character usernames, required fields, password length/confirmation, checks Q1.1, then inserts only a server hash with Q1.2. UNIQUE races return duplicate; persistence failures return an unavailable state. Interactive registration and login redirect were not exercised. |
| UC2 Login | Not verified | Q2.1 retrieves the normalized username and hash; absent user and wrong password share the invalid-credentials state. A signed server-verified cookie is set only after verification. Interactive success/failure and cookie expiry were not exercised. |
| UC3 Accept and record property | Not verified | Q3.1 lists owned properties. Create validates phone, type, lengths, positive Decimal ranges, and requires explicit selection for any matching owner. Q3.4 is rerun under the Q3.2/Q3.3/Q3.5/Q3.6 transaction; all RETURNING rows are checked. Browser flow and rollback fault injection were not exercised. |
| UC4 Advertising checklist | Not verified | Q4.1/Q4.2/Q4.4 read owned properties and existing checks. Q4.3 updates only the selected existing check; published requires a valid timestamp and unpublished requires NULL. No external posting occurs. Browser flow was not exercised. |
| UC5 Appointments | Not verified | Q5.1/Q5.4–Q5.6 load appointments and choices. Create/reschedule/terminal actions use Q5.7 first, then Q5.2/Q5.3/Q5.8 on one PostgreSQL PoolClient transaction; Prisma cannot decode Q5.7's `void` result. Ownership and half-open overlap checks are agent-scoped; details are nullable. Appointment create/reschedule/completion/cancellation and concurrency were not interactively exercised. |
| UC6 Customers | Not verified | Q6.1 lists/filters buyers; Q6.2 creates one. Ten-digit phone is stored as text; blank requirements, budget, and income remain NULL; numeric inputs are precision checked. No delete action is exposed. Interactive persistence was not exercised. |
| UC7 Check status | Not verified | Q7.1/Q7.2 and Q7.3/Q7.4 provide read-only owned-property filtering with NULL for all. Stored statuses use `available`, `in_progress`, and `sold`; filter actions do not write. Empty results and live filter behavior were not exercised in a browser. |
| UC8 Update status | Not verified | Q8.1 lists owned properties; Q8.4 locks the selected property; only the three documented transitions are accepted after explicit confirmation. Q8.2 and Q8.3 run atomically and require returned rows. Live form behavior and forced history failure were not exercised in this turn. |

## Query-reference map

| Identifier | Implementation |
|---|---|
| Q1.1–Q1.2 | `register/actions.ts`: preflight and hash-only insert; UNIQUE race handling. |
| Q2.1 | `login/actions.ts`: normalized lookup and password verification. |
| Q3.1–Q3.6 | `data-service.ts` property list; `api/properties/route.ts` phone matches, owner/property insert and task/publication inserts in one transaction. |
| Q4.1–Q4.4 | `data-service.ts` property/check reads; `api/properties/[id]/postings/route.ts` selected-check update. |
| Q5.1–Q5.8 | `data-service.ts` appointment/choice reads; `appointments/actions.ts` create, overlap, reschedule, complete and cancel through one pg transaction connection. |
| Q6.1–Q6.2 | `data-service.ts` buyer list/filter; `customers/actions.ts` insert. |
| Q7.1–Q7.4 | `data-service.ts` filtered index and full property/owner fields; status filtering remains read-only. |
| Q8.1–Q8.4 | `api/properties/[id]/status/route.ts`: owned-property list, row lock, conditional update and history insert in one Prisma transaction. |
## Checks run and remaining limits

- `pnpm --filter web check-types` passed after the backend/frontend integration.
- The query-catalog verifier compared all 31 SQL strings to the guide byte-for-byte. The pg integration script executed all 31 commands with bound parameters against the isolated `schema_contract_final_test` database.
- A Next-transpiled probe against that isolated database confirmed Prisma's interactive transaction rejects Q5.7 because it cannot deserialize PostgreSQL `void`. UC5 now runs its entire transaction through one PostgreSQL PoolClient from BEGIN to COMMIT/ROLLBACK.
- The schema migration was applied to an isolated test database. No claim is made that a populated/live application database was migrated by this turn.
- All UC1–UC8 interactive flows remain Not verified. See the table above for the specific checks and remaining limits.
Assumptions: new properties start at `ว่าง`; owner matching is per managing
agent and phone; the user's later request removed UC5's free-text relevant
person field; Land Department document readiness stays
an operational precondition. The written ER cardinality for owner/buyer `userId`
is interpreted as a many-to-one managing-agent relationship, as required by
the one-agent product rule.
