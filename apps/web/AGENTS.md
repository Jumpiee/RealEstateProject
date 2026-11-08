Task
The website is already implemented. Update its database and the code that depends on the database schema to match the ER model in this file and the supplied ER diagram. Do not rebuild or redesign the website.

Read all of requirement.md before making changes. Treat its eight use cases, use case diagram/descriptions, and this file as the functional contract. Preserve all goals, preconditions, postconditions, main-flow steps, alternative flows, field names, validations, query identifiers, and Thai interface messages. Scope changes to the schema migration and the smallest backend/API/frontend adjustments needed to keep the completed website working with the new schema.
Delegation
The root coding agent must delegate work to multiple subagents. When spawning them, request gpt-6-luna with high reasoning effort for each agent.

Assign separate ownership so agents do not edit the same files:
1. Schema and migration — inspect the existing schema and migration history; implement the ER-aligned schema and safe data migration. Own schema and migration files.
2. Backend persistence — update models, validation, repository/service logic, SQL, and API handlers to use the agreed schema contract. Do not edit schema/migration files.
3. Frontend compatibility — inspect all existing UI calls, forms, and types affected by the schema change. Make only the minimum compatibility changes needed; do not redesign finished pages or add new business modules.
4. Read-only reviewer — compare the finished change with this file, the ER diagram, and requirement.md; report missing fields/relations, data-loss risks, broken use-case behavior, and stale database references. Do not edit files.
Before parallel implementation, the root agent must inspect the repository, share the schema contract with all agents, and assign exact file boundaries. The root agent owns integration, conflict resolution, and the final report. If subagent spawning is unavailable, work through the same roles in sequence and say so in the handover.
Product boundaries
- The system is for one real-estate agent. Owners and customers/buyers are records managed by the agent; they do not have accounts or login.
- The existing website and its eight use cases are already built. Preserve their behavior; do not implement them again from scratch.
- Keep the existing main menus: อสังหาริมทรัพย์, นัดหมาย, and ลูกค้า.
- Property recording, listing checklists, status filtering, and status updates stay in the property section.
- Property evaluation and acceptance are decisions made by the agent. Publication checks track the agent's manual posting on external websites.
- Do not add automatic valuation, loan processing, document uploads, contracts, public property listings, owner/customer login, or any other business module.
- Keep visible text and messages in Thai. Change visible UI only when required to adapt to a changed data/API contract; preserve existing wording from requirement.md.
- Preserve all query identifiers in requirement.md: Q1.1–Q1.2, Q2.1, Q3.1–Q3.3, Q4.1–Q4.3, Q5.1–Q5.3, Q6.1–Q6.2, Q7.1–Q7.2, and Q8.1–Q8.3. Map every reference to its implementation. Where only a query purpose is given, implement the smallest query that satisfies it.
- Use parameterized database queries and securely hash passwords. Never store plaintext passwords or confirmation-password values.
- Scope each agent's records and appointments to the authenticated agent. Store phone numbers as strings to preserve leading zeroes.
- Keep status filtering read-only. Selecting a new property status must not save it; save only when บันทึกสถานะ is clicked. Save the status update and its history record atomically.
- In UC4, save a website's posting status and date when the agent records the check.
- Preserve existing form values when correcting validation errors, identify the relevant fields, and handle password fields securely. Show success only after the database operation succeeds. Invalid data must not be saved.
- When a technical detail is unspecified, use the smallest supporting implementation and record the assumption. Do not silently change a use case. If a conflict blocks a required flow, report the exact conflict and the chosen resolution.
ER model to implement
Use the project’s established database naming and type conventions where possible. Physical table names may follow the existing ORM/database convention, but map them consistently to these entities and fields.
USER
- user_id — primary key
- username — required, unique
- password_hash — required; hashed password only
OWNER
- owner_id — primary key
- user_id — required foreign key to USER.user_id
- name — required
- phone — required
BUYER
- buyer_id — primary key
- user_id — required foreign key to USER.user_id
- name — required
- phone — required
- requirements — required
- budget — nullable
- income — nullable
PROPERTY
- property_id — primary key
- user_id — required foreign key to USER.user_id
- owner_id — required foreign key to OWNER.owner_id
- name — required
- type — required
- address — required
- area — required
- price — required
- status — required
- description — required
PROPERTY_STATUS_HISTORY
- history_id — primary key
- property_id — required foreign key to PROPERTY.property_id
- changed_by — required foreign key to USER.user_id
- old_status — required
- new_status — required
- changed_at — required
APPOINTMENT
- appointment_id — primary key
- user_id — required foreign key to USER.user_id
- owner_id — nullable foreign key to OWNER.owner_id
- buyer_id — nullable foreign key to BUYER.buyer_id
- property_id — nullable foreign key to PROPERTY.property_id
- appointment_type — required
- start_at — required
- end_at — required
- status — required
- details — required
PROPERTY_TASK
- task_id — primary key
- property_id — required foreign key to PROPERTY.property_id
- step_name — required
- step_order — required
- status — required
- completed_at — nullable
PUBLICATION_CHECK
- publication_check_id — primary key
- property_id — required foreign key to PROPERTY.property_id
- website_name — required
- is_published — required
- published_at — nullable
Relationships, constraints, and semantics
- Implement all eight entities, primary keys, foreign keys, and required/nullable fields above.
- Enforce USER.username uniqueness. Index foreign keys and relationship columns as appropriate to existing query patterns.
- Retain OWNER.user_id and BUYER.user_id as foreign keys as shown. The product rule says there is one agent who manages multiple owner/buyer records and those people do not log in. Interpret these user_id fields as the managing/creating agent reference; do not create owner/buyer accounts. Do not add a uniqueness constraint to either field if it would prevent the agent from managing multiple records. If the diagram’s cardinality notation appears to conflict with this required product behavior, document the conflict and this mapping.
- PROPERTY keeps both user_id and owner_id. Do not remove either because one seems derivable from the other.
- APPOINTMENT.owner_id, APPOINTMENT.buyer_id, and APPOINTMENT.property_id are nullable. Do not impose stricter participant requirements unless requirement.md explicitly requires them.
- BUYER.budget, BUYER.income, PROPERTY_TASK.completed_at, and PUBLICATION_CHECK.published_at are nullable.
- Preserve status values and validation from requirement.md or the existing application. Do not invent new status/type values.
- Store phone numbers as strings. Use appropriate numeric/decimal storage for area, budget, income, and price based on existing forms and validation.
- Choose delete/update behavior deliberately. Do not cascade-delete history or other meaningful records without a documented requirement.
- Preserve existing data. Do not drop or overwrite tables/columns until a migration and verified mapping preserve their usable content.
Required implementation sequence
1. Inspect the full repository, including AGENTS.md instructions, requirement.md, schema, migration history, ORM models, raw SQL, seed data, server routes, frontend data types, and every database consumer.
2. Produce a brief old-to-new schema mapping and identify conflicts or ambiguous values before implementation. Share it with the subagents.
3. Implement a safe, preferably reversible migration. Backfill records when the mapping is clear. Keep unmappable data and document the decision rather than silently discarding it.
4. Update all backend models, queries, validation, and API shapes affected by the schema. Keep status changes and history writes in one transaction.
5. Update only the existing frontend integrations that no longer match the API/schema. Preserve the finished design and all existing use-case flows.
6. Search the repository for old table/column names and stale data shapes. Confirm each remaining reference is intentional.
7. Review the result with the read-only reviewer, fix identified failures, and hand over the implementation.
Completion review
Recheck the changes against requirement.md and this file before declaring completion.
- Maintain a traceability checklist for UC1–UC8, including goals, preconditions, postconditions, main-flow steps, and alternative flows. For database changes, identify whether each use case is affected and what was checked.
- Confirm required database actions and Q-reference mappings for Q1.1–Q1.2, Q2.1, Q3.1–Q3.3, Q4.1–Q4.3, Q5.1–Q5.3, Q6.1–Q6.2, Q7.1–Q7.2, and Q8.1–Q8.3.
- Confirm the database/API changes preserve all required fields, null handling, and validation behavior.
- Confirm records persist after refresh; invalid submissions do not save; rejected properties are not saved; failed login does not create a session.
- Confirm appointment conflict checks remain scoped to the same agent and UC7 supports ทั้งหมด and empty results.
- Confirm property status filtering does not write. Confirm status writes occur only after บันทึกสถานะ and persist old status, new status, and timestamp together.
- Confirm UC4 saves the selected website’s publication state and date.
- Use the repository’s existing verification workflow and report what was actually checked. Never mark an unverified item as passed.
- Report each UC as Passed, Failed, or Not verified with concise evidence. Explicitly list blockers and assumptions. Do not claim the whole website was rebuilt; the task is database alignment and necessary compatibility work.
Final handover
Summarize the schema and application changes, migration/data-mapping decisions, how to run any required migration and the website, the UC1–UC8 verification results, assumptions, and unresolved blockers.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
