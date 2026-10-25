Instructions for the coding agent
Task
Build a simple, functional website named ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า using requirement.md in this directory as the product specification.

Read the entire requirements file before designing or implementing the website. Treat its eight use cases and the supplied use case diagram/descriptions as the scope. Preserve all goals, preconditions, postconditions, main-flow steps, alternative flows, fields, validations, query identifiers, and Thai interface messages.
Working rules
- Implement all eight use cases with functional actions and persistent data.
- Use Thai for visible interface labels and messages. Keep the interface simple and readable on desktop and mobile.
- Provide registration, login, and the agent's main page. Use the main menus อสังหาริมทรัพย์, นัดหมาย, and ลูกค้า.
- Place property recording, listing checklists, status filtering, and status updating within the property section.
- Add only supporting UI and technical behavior needed to complete the use cases. Do not introduce additional business modules.
- The agent is the only system user. Owners and customers are records managed by the agent and do not have accounts.
- Property evaluation and acceptance are decisions made by the agent. The checklist records the agent's manual posting on external websites.
- Do not add automatic valuation, loan processing, document uploads, contracts, public property listings, or customer/owner login.
- Keep UC numbers and query identifiers consistent with requirement.md. Map each Q reference to its implementation. Where the source specifies only a query purpose, implement the smallest query that fulfills it using the chosen database schema.
- Use parameterized database queries and securely hash passwords. Never store plaintext passwords or confirm-password values.
- Use the authenticated agent's identity for their records and appointments.
- Preserve entered form values when returning to correct an error, and identify the relevant fields. Handle password fields securely.
- Show success only after the database operation succeeds. A failed validation must not save invalid data.
- Store phone numbers as strings so leading zeroes are preserved.
- Keep checking a property status separate from updating it. Filtering must not write to the database.
- Save a website's posting status and date when it is checked in UC4.
- Do not write a new property status when the agent merely selects it; save only after บันทึกสถานะ is clicked.
- Save a property status update and its history consistently so one cannot succeed without the other.
- When a technical detail is unspecified, choose the smallest supporting implementation and record the assumption. Do not silently change a use case. If a contradiction prevents a required flow, explain the specific conflict.
Completion review
Recheck the completed implementation against every requirement in requirement.md before declaring the work finished.
1. Maintain a traceability checklist for UC1–UC8, including goals, preconditions, postconditions, every main-flow step, and all alternative flows.
2. Confirm every required button and navigation path works.
3. Confirm all specified form fields and Thai messages are present.
4. Check every validation rule and its correction/resubmission path.
5. Confirm every listed query reference has the required database operation: Q1.1–Q1.2, Q2.1, Q3.1–Q3.3, Q4.1–Q4.3, Q5.1–Q5.3, Q6.1–Q6.2, Q7.1–Q7.2, and Q8.1–Q8.3.
6. Confirm saved records persist after refreshing the page.
7. Verify failed validation does not save invalid records.
8. Verify rejected properties are not saved and unsuccessful login does not create an authenticated session.
9. Verify appointment conflicts are checked for the same agent.
10. Verify ทั้งหมด and the empty-result handling in UC7 work correctly.
11. Verify selecting a property status does not save it until บันทึกสถานะ is clicked.
12. Verify a saved status change records the old status, new status, and timestamp.
13. Report each use case as Passed, Failed, or Not verified, with evidence and any outstanding issue. Never mark an untested requirement as passed.
14. Fix failures before declaring completion and explicitly list remaining blockers.
Final handover
Summarize what was implemented, explain how to run the website, provide the UC1–UC8 verification results, and state any assumptions or unresolved blockers.