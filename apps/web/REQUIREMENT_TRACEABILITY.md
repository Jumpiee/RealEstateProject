# Requirement traceability review

Static review plus focused local HTTP/API and PostgreSQL checks. API/database operations were exercised with disposable test agents and their related rows were deleted afterward. The local browser UI could not be exercised: no browser provider was available in CUA, and Chrome window capture timed out. A CLI Server Action form POST returned “Failed to find Server Action” against the prior deployment; the current auth form update has not been run interactively, so registration/login, customer-create and appointment-create actions remain unverified. “Passed” query-level evidence below is not an end-to-end use-case pass.

## Result summary

| Use case | Result | Evidence / outstanding issue |
|---|---|---|
| UC1 Register | Not verified | `RegisterForm` uses `useActionState` and controlled client state. It renders all three fields, masks both passwords, and retains username/password/confirmation after validation errors. Correction links target the relevant username/password/confirmation field. Actual registration and Q1 persistence remain unverified. |
| UC2 Login | Not verified | `LoginForm` uses `useActionState` and controlled client state; it retains username, clears password after invalid credentials, and links correction to the username or password field. Session middleware accepted a directly seeded, valid database session, but login lookup/hash verification and session creation through the login action remain unverified. |
| UC3 Accept and record property | Not verified | API/DB assertions passed for invalid-price no-write, zero price, property persistence, and same-agent owner reuse. The form/navigation and correction UI were not exercised. |
| UC4 Advertising checklist | Not verified | API/DB assertions passed for the Q4.2 website list and Q4.3 posting status/date. The property checklist interaction and refreshed visual checkmark were not exercised. |
| UC5 Appointments | Not verified | Authenticated list rendered a persisted appointment; direct DB checks confirmed overlap-query semantics for same-agent overlap, other-agent isolation and adjacency. Appointment create/conflict Server Action remains unverified. |
| UC6 Customers | Not verified | Authenticated customer list rendered a persisted test record and PostgreSQL preserved a leading-zero phone string. Customer-create Server Action remains unverified. |
| UC7 Check/filter property status | Not verified | API/DB assertions passed for ทั้งหมด, empty status result, and unchanged rows/timestamps after filtering. The UI empty-state text and reset button were not interacted with. |
| UC8 Update property status | Not verified | API/DB assertion passed for persisted status plus old/new/timestamp history. UI selection-without-save and transaction rollback on a failing history write were not exercised. |

## Use-case flow trace

| UC / required trace | Code path and static evidence | Result |
|---|---|---|
| UC1 goal, precondition, postcondition | `/register` is public when unauthenticated; success redirects to `/login?registered=1`, which renders `สมัครสมาชิกสำเร็จ`. `register/actions.ts`; `register/page.tsx`. | Not verified |
| UC1 main 1–3: registration fields, submit, required/nonblank username, min-8 password, confirmation | `register-form.tsx` renders the three controlled fields; password/confirmation are masked. `register/actions.ts` returns `useActionState` errors after checking required fields, trimmed nonblank username, minimum length and confirmation. Exact messages are `กรุณากรอกข้อมูลให้ครบ`, `รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร`, and `รหัสผ่านไม่ตรงกัน`; field hints are separate. Current action-state behavior was not browser-tested. | Not verified |
| UC1 main 4–6 / Q1.1–Q1.2 | `register/actions.ts`: `agent.findUnique(username)` duplicate lookup (Q1.1 purpose), `agent.create({ username, passwordHash })` (Q1.2); hash via scrypt in `lib/agent-auth.ts`; duplicate-key race handled as `ชื่อผู้ใช้นี้ถูกใช้แล้ว`; confirm is not persisted; successful redirect to login. | Not verified |
| UC1-A1 invalid fields and correction | `register/actions.ts` returns error state without redirect; controlled `register-form.tsx` retains username, password and confirmation, keeps password fields masked, shows the exact validation message plus a separate field hint, and links `กลับไปแก้ไข` to the relevant field (`#username`, `#password`, or `#confirmPassword`). | Not verified |
| UC1-A2 duplicate username | Duplicate check plus unique-constraint catch returns `ชื่อผู้ใช้นี้ถูกใช้แล้ว`; the controlled form retains current values, identifies `ชื่อผู้ใช้`, and links `กลับไปแก้ไข` to `#username`. `register/actions.ts`, `register-form.tsx`. | Not verified |
| UC2 goal, precondition, postcondition | Login page is public until agent session exists; successful action creates session and redirects `/dashboard`. `login/page.tsx`, `login/actions.ts`, `lib/agent-auth.ts`. | Not verified |
| UC2 main 1–3: fields, username display, masked password, required checks | `login-form.tsx` has controlled username/password fields; password is `type=password`. `login/actions.ts` checks both values and trims username. `useActionState` returns required/invalid errors without query-string redirects; the form displays exact required/invalid messages and separate field hints. | Not verified |
| UC2 main 4–6 / Q2.1 | `login/actions.ts`: `agent.findUnique(username)` selects account including `id` and hash; verifies with scrypt and creates a database-backed, hashed-token, HTTP-only session only on success. | Not verified |
| UC2-A1 missing credentials | Returns `required` action state, rendered as `กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ`; controlled username and password remain, the hint names missing fields, and `กลับไปแก้ไข` targets `#username` or `#password` as appropriate. `login/actions.ts`, `login-form.tsx`. | Not verified |
| UC2-A2 missing account/wrong password | Returns `invalid` action state and renders exact message `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง` with a separate password hint; username remains, `useEffect` clears password, and `กลับไปแก้ไข` targets `#password`. Session creation occurs only after successful hash comparison. `login/actions.ts`, `login-form.tsx`. | Not verified |
| UC3 goal/precondition/postcondition; step 1 agent acceptance | UI says to enter property already decided to accept; there is no automatic valuation or rejection-save path. `properties/properties.tsx`. Rejection behavior is not an explicit UI action. | Not verified |
| UC3 main 2 / Q3.1 | Authenticated property page lists current statuses via `property.findMany` scoped to `agentId`: `properties/page.tsx`. | Not verified |
| UC3 main 3–4 fields and entry | Owner name/phone, property name/type/address/area/price/description controlled inputs: `properties/properties.tsx`. | Not verified |
| UC3 main 5 / UC3-A2 validation and correction | API returned the required-fields error and `price` field marker for blank price; DB count remained zero. UI correction was not exercised. `api/properties/route.ts`, `lib/property-validation.ts`, `properties/properties.tsx`. | Passed (API/DB validation) |
| UC3 main 6 / Q3.2–Q3.3 | API persisted a property at price 0; a second property with the same owner phone reused the same owner; direct DB counts confirmed one owner. `api/properties/route.ts`. | Passed (API/DB) |
| UC3 main 7 / UC3-A1 | Success feedback only follows successful POST; no save request is sent for rejected properties because no rejection action exists. `properties/properties.tsx`. | Not verified |
| UC4 goal/precondition/postcondition; main 1 / Q4.1 | Property list includes owner/status/postings scoped to agent: `properties/page.tsx`. | Not verified |
| UC4 main 2 / Q4.2 | Authenticated API GET returned property checklist and all three predefined websites. Current client uses included data from the initial property-list query instead of calling this GET. `api/properties/[id]/postings/route.ts`. | Passed (API/DB) |
| UC4 main 3–4 and UC4-A1 | Static sites are DDproperty, LivingInsider, Facebook; checklist displays status/date and checkmark; agent triggers save after manual posting. Required action label `เว็บที่ลงประกาศ` is in `properties/properties.tsx`. | Not verified |
| UC4 main 5 / Q4.3 | Authenticated API POST and direct DB query confirmed `ลงแล้ว` plus non-null `postedAt`. `api/properties/[id]/postings/route.ts`. | Passed (API/DB) |
| UC4 main 6 | Updated checklist is refreshed after successful save; incomplete sites remain available. `properties/properties.tsx`. | Not verified |
| UC5 goal/precondition/postcondition; main 1 / Q5.1 | Authenticated `/appointments` page returned a directly seeded appointment for the logged-in agent. `appointments/page.tsx`. | Passed (HTTP/DB list) |
| UC5 main 2–3 fields and choices | Type, relevant person, customer and property selectors, start/end, details; supported types in `lib/appointment-validation.ts`; property required for view/Land Department appointments, optional for intake. Customer link remains optional; relevant person is separately required. `appointments/appointment-form.tsx`, `lib/appointment-validation.ts`. | Not verified |
| UC5 main 4 / UC5-A1 validation and correction | Validator checks supported type, nonblank relevant person/details, required property by appointment type, valid/future Bangkok wall-clock start and end after start; returns combined explanation `วันเวลานัดต้องไม่เป็นอดีตและเวลาสิ้นสุดต้องหลังเวลาเริ่ม`, field errors and values. `lib/appointment-validation.ts`, `appointments/actions.ts`, `appointments/appointment-form.tsx`. | Not verified |
| UC5 main 5 / Q5.2 and UC5-A2 | Direct PostgreSQL execution of the implemented predicate found an overlapping same-agent interval, excluded another agent's interval, and allowed an adjacent interval. Server Action response and no-insert behavior were not exercised. `appointments/actions.ts`. | Not verified (query semantics checked) |
| UC5 main 6–7 / Q5.3 | Creates appointment with agent ID, type/person, selected optional IDs, times/details and initial `นัดแล้ว`; redirect shows success and latest list. `appointments/actions.ts`, `appointments/page.tsx`. | Not verified |
| UC6 goal/precondition/postcondition; main 1 / Q6.1 | Authenticated `/customers` page rendered a directly seeded customer and phone. `customers/page.tsx`. | Passed (HTTP/DB list) |
| UC6 main 2–3 fields | Name, telephone string and requirements inputs: `customers/customer-form.tsx`. | Not verified |
| UC6 main 4 / UC6-A1 validation and correction | Nonblank name and exact ten-digit phone validation; exact required messages, field errors and values returned to same form. `lib/customer-validation.ts`, `customers/actions.ts`, `customers/customer-form.tsx`. | Not verified |
| UC6 main 5–6 / Q6.2 | Inserts agent-owned customer with phone stored as string; redirects to success and latest list. `customers/actions.ts`, `customers/page.tsx`. | Not verified |
| UC7 goal/precondition/postcondition; main 1 / Q7.1 | Initial property list/status query is scoped by agent: `properties/page.tsx`. | Not verified |
| UC7 main 2–4 / Q7.2 | API returned two records for ทั้งหมด and zero for the empty ขายแล้ว filter. Direct before/after queries confirmed property statuses and `updatedAt` were unchanged. UI dropdown interaction not exercised. `properties/properties.tsx`, `api/properties/route.ts`. | Passed (API/DB filter) |
| UC7-A1 no matches / empty inventory | UI text/control are present in source. The live empty-state message and `แสดงทั้งหมด` action were not browser-tested. `properties/properties.tsx`. | Not verified |
| UC8 goal/precondition/postcondition; main 1 / Q8.1 | Authenticated property list/status query: `properties/page.tsx`. | Not verified |
| UC8 main 2–3 selection without save | Status selector changes only React state; no request until form submit. Modal displays property name, type, owner, address, area, price, description, current status and selector. `properties/properties.tsx`. | Not verified |
| UC8 main 4 / UC8-A1 validation and correction | Requires selected property and one of three allowed values; exact specified Thai error including terminal period and `กลับไปแก้ไข` control. `properties/properties.tsx`, status API. | Not verified |
| UC8 main 5 / Q8.2–Q8.3 | API POST plus DB queries confirmed status changed from ว่าง to กำลังดำเนินการ and exactly one history row contained old/new status and timestamp. Rollback on forced history-write failure was not exercised. `api/properties/[id]/status/route.ts`. | Passed (API/DB success path) |
| UC8 main 6 | API returns success only after transaction; client refreshes persisted properties. `properties/properties.tsx`, status API. | Not verified |

## Query-reference map

| Query | Implementation path / operation | Review result |
|---|---|---|
| Q1.1 | `register/actions.ts` — unique username lookup (`agent.findUnique`). | Not verified |
| Q1.2 | `register/actions.ts` — create username + scrypt hash only. | Not verified |
| Q2.1 | `login/actions.ts` — retrieve user ID/hash by username. | Not verified |
| Q3.1 | `properties/page.tsx` and authenticated property-list API — list properties/current status. | Passed (API/DB list) |
| Q3.2 | `api/properties/route.ts` — owner lookup by agent + phone; create if absent. | Passed (API/DB reuse) |
| Q3.3 | `api/properties/route.ts` — create linked property. | Passed (API/DB persistence) |
| Q4.1 | `properties/page.tsx` — list properties. | Not verified |
| Q4.2 | `api/properties/[id]/postings/route.ts` GET; current UI also preloads checklist with Q4.1 list. | Passed (API/DB) |
| Q4.3 | `api/properties/[id]/postings/route.ts` POST — upsert status/date. | Passed (API/DB) |
| Q5.1 | `appointments/page.tsx` — agent-scoped appointment list. | Passed (HTTP/DB list) |
| Q5.2 | `appointments/actions.ts` — agent-scoped overlap SELECT. | Not verified (predicate semantics checked directly) |
| Q5.3 | `appointments/actions.ts` — insert appointment and initial status. | Not verified |
| Q6.1 | `customers/page.tsx` — agent-scoped customer list. | Passed (HTTP/DB list) |
| Q6.2 | `customers/actions.ts` — insert customer; phone remains string. | Not verified |
| Q7.1 | `properties/page.tsx` — list all current statuses. | Not verified |
| Q7.2 | `api/properties/route.ts` GET — optional stored-status filter; none for ทั้งหมด. | Passed (API/DB filter/no-write) |
| Q8.1 | `properties/page.tsx` — list current property status. | Not verified |
| Q8.2 | `api/properties/[id]/status/route.ts` — property status update. | Passed (API/DB success path) |
| Q8.3 | Same route — insert status-history record in same transaction. | Passed (API/DB success path) |

## Cross-cutting checks and blockers

- Static evidence shows parameterized ORM calls and agent scoping for the main data queries; the auth module stores scrypt password hashes and an HTTP-only session cookie. Runtime security/session isolation remains unverified.
- Focused existing and added Node validation tests were run: 11 passed, 0 failed (`customer-validation.test.mjs`, `appointment-validation.test.mjs`, `property-validation.test.mjs`). They cover validators and Bangkok datetime parsing, not server-action persistence. Agent A reports Prisma generation and web typecheck passed; the manager reports production build passed.
- HTTP/API plus PostgreSQL assertions: 10 passed for session-cookie API authorization, unauthenticated redirect, UC3 validation/no-write/property+owner persistence, UC4 checklist/sites/status/date, UC7 all/empty/no-write filter, and UC8 status/history success path. A separate 6 passed for UC5 overlap predicate semantics (same-agent conflict, other-agent isolation, adjacency), UC5 authenticated list, UC6 phone string preservation, and UC6 authenticated list rendering. All disposable agents and cascade-owned test data were deleted.
- Auth form state: registration retains username, password and confirmation in client state after validation errors; password fields remain masked and values are not echoed into the action-state error. Login retains username and clears password after invalid credentials. Both forms show exact requirement messages, separate field hints and target `กลับไปแก้ไข` at the relevant input. Browser actions remain unavailable because CUA listed no browser provider and Chrome window capture timed out; the earlier CLI action-ID mismatch was against the prior deployment. Therefore registration/login, customer-create and appointment-create actions, UC7's live empty-state button/text, UC8's select-without-save UI, and rollback after a forced history-write failure remain unverified.
- UC5 now explicitly interprets `datetime-local` values as Asia/Bangkok UTC+07:00 in `parseBangkokDateTimeLocal()` and formats appointment lists in the same zone; its focused test checks the conversion. Persistence/conflict behavior still needs runtime verification.
- Assumptions: new properties receive initial status `ว่าง` from the schema default; owner records are deduplicated per authenticated agent and contact number, matching agent-owned data isolation. Following manager direction, customer linkage is optional because the relevant person may be an owner; property is optional for intake/evaluation appointments but required for property viewing and Land Department appointments. Land Department document readiness is an operational precondition and is not represented by an application record.
