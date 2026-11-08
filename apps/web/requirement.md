Requirements for the Real Estate Management Website
Product and scope
Name: ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า

Actor for every use case: นายหน้า — Real Estate Agent.

The website is an internal tool for agents. Property owners and customers are records managed by agents and do not have accounts.

The supplied use case diagram and eight use case descriptions define the scope. The requirements below preserve their goals, preconditions, postconditions, steps, validation rules, database operations, Thai messages, and alternative flows.

Use these property statuses consistently: ว่าง, กำลังดำเนินการ, and ขายแล้ว. The ทั้งหมด option is a filter, not a stored property status.
UC1 สมัครบัญชี — Register
Goal: The agent has an account for accessing the system.

Precondition: The agent is on the registration page and does not yet have an account.

Postcondition: The system saves the agent's account and displays the login page.
Main flow
1. The agent opens the Register page. Display username, password, and confirm-password fields.
2. The agent enters all three values.
3. The agent clicks สมัครสมาชิก. Check that all three fields are completed, the username is not whitespace only, the password contains at least 8 characters, and the password matches its confirmation.
4. Execute Q1.1 to check for a duplicate username:SELECT EXISTS(SELECT 1 FROM user WHERE username = ?);
   Continue when no duplicate exists.
5. Hash the password and execute Q1.2:INSERT INTO user (username, password_hash) VALUES (?, ?);
   Save the username and password hash. Do not save the confirm-password value.
6. After successful insertion, display สมัครสมาชิกสำเร็จ and navigate to the login page.
Alternative flows
UC1-A1 — Invalid input at step 3
- Identify invalid fields and display the applicable message: กรุณากรอกข้อมูลให้ครบ, รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร, or รหัสผ่านไม่ตรงกัน.
- Provide กลับไปแก้ไข. Return to step 2 at the relevant field.
- On resubmission, repeat step 3. If valid, continue through steps 4–6.
UC1-A2 — Duplicate username at step 4
- Display ชื่อผู้ใช้นี้ถูกใช้แล้ว. Do not create the account.
- Provide กลับไปแก้ไข and return to step 2 at the username field.
- On resubmission, repeat steps 3–4. Continue through steps 5–6 only when valid and the username is available.
UC2 เข้าสู่ระบบเว็บไซต์ — Login
Goal: The agent accesses the system using their own account.

Precondition: The agent has an account and is on the login page.

Postcondition: The system establishes an authenticated session and displays the agent's main page.
Main flow
1. The agent opens the login page. Display username and password fields.
2. The agent enters credentials. Display the entered username and mask the password characters.
3. The agent clicks เข้าสู่ระบบ. Check that both fields are completed and the username is not whitespace only.
4. Execute Q2.1 and retrieve the account matching the username:SELECT user_id, password_hash FROM user WHERE username = ?;
5. Verify the entered password against the account's stored password hash.
6. When verification succeeds, establish the authenticated session using the retrieved user ID and display the agent's main page.
Alternative flows
UC2-A1 — Missing credentials at step 3
- Identify missing fields and display กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ.
- Provide กลับไปแก้ไข and return to step 2.
- On resubmission, repeat step 3. If valid, continue through steps 4–6.
UC2-A2 — Account not found or incorrect password at steps 4–5
- Display ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง. Do not establish an authenticated session.
- Provide กลับไปแก้ไข and return to step 2 so the agent can review the username and re-enter the password.
- Repeat steps 3–5 on resubmission. Continue to step 6 only when authentication succeeds.
UC3 ประเมิน รับ และบันทึกข้อมูลอสังหา
Goal: The agent records a property they have evaluated and decided to accept.

Precondition: The agent is logged in and has received property information from the owner.

Postcondition: The system saves the relevant owner and the accepted property.
Main flow
1. The agent evaluates the property's suitability and decides to accept it. Evaluation and acceptance are the agent's responsibility.
2. The agent opens อสังหาริมทรัพย์. Execute Q3.1: SELECT to display properties and their current statuses.
3. The agent clicks เพิ่มอสังหา. Display these fields:
   - Owner name.
   - Owner contact number.
   - Property name.
   - Property type.
   - Address.
   - Area.
   - Price.
   - Description.
4. The agent enters the owner and property information.
5. The agent clicks บันทึก. Validate that:
   - Required fields are completed.
   - Names are not whitespace only.
   - The contact number consists of exactly 10 digits.
   - Area is numeric and greater than 0.
   - Price is numeric and not negative.
6. Execute Q3.2: SELECT to find an owner by contact number. Reuse the existing owner ID if found; otherwise use INSERT to create the owner. Execute Q3.3: INSERT to save the property's name, type, address, area, price, description, and owner relationship.
7. Display บันทึกอสังหาสำเร็จ and show the saved details.
Alternative flows
UC3-A1 — Property rejected at step 1
- If the agent decides not to accept the property, do not save it. End the use case according to the business flow.
UC3-A2 — Invalid information at step 5
- Identify invalid fields and display the applicable message: กรุณากรอกข้อมูลให้ครบ, เบอร์ติดต่อต้องเป็นตัวเลข 10 หลัก, พื้นที่ต้องมากกว่า 0, or ราคาต้องไม่ติดลบ.
- Provide กลับไปแก้ไข and return to step 4 at the relevant field.
- Revalidate at step 5 on resubmission. Continue through steps 6–7 only when valid.
UC4 ประกาศขายและบันทึก Checklist
Goal: The agent records a checklist of websites where a property has been advertised.

Precondition: An accepted property exists. The agent manually posts advertisements on external websites.

Postcondition: The system saves the posting status and posting date for each website checked by the agent.
Main flow
1. The agent opens อสังหาริมทรัพย์. Execute Q4.1: SELECT to display the properties.
2. The agent selects a property. Execute Q4.2: SELECT to display its details and sales checklist.
3. The agent clicks เว็บที่ลงประกาศ. Display the predefined websites, including DDproperty, LivingInsider, and Facebook, together with the selected property's checklist status.
4. The agent manually posts outside the system, returns, and checks the website that was successfully posted to. Show a check mark beside that website.
5. Execute Q4.3: UPDATE to save that website's status as ลงแล้ว and its posting date for the selected property.
6. The agent checks whether all desired websites are completed. Display the latest checklist and end the use case when complete.
Alternative flow
UC4-A1 — Some desired websites remain incomplete at step 6
- The agent clicks เว็บที่ลงประกาศ.
- Return to step 3 and show the remaining websites that have not been posted to.
- The agent posts to another website and checks it at step 4.
- Save the update at step 5 and repeat the completeness check at step 6.
UC5 จัดการนัดหมายต่าง ๆ
Goal: The agent maintains appointment information with relevant parties.

Precondition: The agent is logged in and has already agreed on the appointment date and time with the relevant parties.

Postcondition: The system saves the appointment and displays the latest appointment list.
Main flow
1. The agent opens นัดหมาย. Execute Q5.1: SELECT to display appointments belonging to the logged-in agent.
2. The agent clicks เพิ่มนัดหมาย. Display appointment type, relevant person, property, date, start time, end time, and details. Provide customer and property choices.
3. The agent selects the type, relevant person, property, date and times, and enters details. Supported appointment types are รับข้อมูล/ประเมินอสังหา, ดูอสังหา, and ไปกรมที่ดิน. A Land Department appointment takes place after the documents have been checked and are ready.
4. The agent clicks บันทึกนัดหมาย. Check that required information is completed, the date and time are valid, the appointment does not start in the past, and the end time is after the start time.
5. Execute Q5.2: SELECT to check overlapping appointment periods for the same agent. Continue when there is no conflict.
6. Execute Q5.3: INSERT to save appointment type, relevant person, agent ID, property, date, times, details, and initial status นัดแล้ว.
7. Display บันทึกนัดหมายสำเร็จ and show the latest appointment list.
Alternative flows
UC5-A1 — Missing or invalid information at step 4
- Identify missing or invalid fields. Display the relevant explanation, including วันเวลานัดต้องไม่เป็นอดีตและเวลาสิ้นสุดต้องหลังเวลาเริ่ม.
- Provide กลับไปแก้ไข and return to step 3 at the relevant field.
- Repeat steps 4–5 on resubmission. Continue through steps 6–7 only when valid and conflict-free.
UC5-A2 — Appointment conflict at step 5
- Display เวลานี้คุณมีนัดอื่นอยู่แล้ว. Do not save the appointment.
- Provide กลับไปแก้ไข and return to step 3 at the date/time fields to select a new date or time.
- Revalidate at step 4 and repeat the conflict check at step 5. Continue through steps 6–7 only when no conflict remains.
UC6 บันทึกข้อมูลลูกค้า
Goal: The agent stores customer contact information and requirements.

Precondition: The agent is logged in and has obtained information through a conversation with the customer.

Postcondition: The system saves the customer and displays the newly added information.
Main flow
1. The agent opens ลูกค้า. Execute Q6.1: SELECT to display the customer list.
2. The agent clicks เพิ่มลูกค้า. Display customer name, phone number, and requirements fields.
3. The agent enters the customer's name, phone number, and requirements.
4. The agent clicks บันทึก. Check that the customer name is not empty or whitespace only and the phone number consists of exactly 10 digits.
5. Execute Q6.2: INSERT to save customer name, phone number, and requirements.
6. Display บันทึกข้อมูลลูกค้าสำเร็จ and show the newly added customer information.
Alternative flow
UC6-A1 — Invalid customer name or phone number at step 4
- Identify the invalid field. Display กรุณากรอกชื่อลูกค้า or เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก, as applicable.
- Provide กลับไปแก้ไข and return to step 3 at the invalid field.
- Revalidate at step 4 after resubmission. Continue through steps 5–6 only when valid.
UC7 เช็กสถานะอสังหา
Goal: The agent can view a property's current status.

Precondition: The agent is logged in and opens the property list.

Postcondition: The system displays properties matching the status filter without changing stored property information.
Main flow
1. The agent opens อสังหาริมทรัพย์. Execute Q7.1: SELECT to display properties and their current statuses.
2. The agent uses a dropdown to select ทั้งหมด, ว่าง, กำลังดำเนินการ, or ขายแล้ว. Execute Q7.2: SELECT to find properties matching the chosen status. When ทั้งหมด is selected, retrieve properties without a status filter.
3. If matching records exist, display their property details and statuses.
4. The agent reads the required status. Preserve the stored status and end the use case.
Alternative flow
UC7-A1 — No matching records at step 2
- Display ไม่พบข้อมูลอสังหาตามสถานะที่เลือก and provide แสดงทั้งหมด.
- When clicked, return to step 2 with ทั้งหมด selected.
- If records exist, continue through steps 3–4.
- If no properties exist at all, display ยังไม่มีข้อมูลอสังหา and end the use case.
UC8 อัปเดตสถานะอสังหา
Goal: The agent updates a property's status to match the actual progress of the sale.

Precondition: The agent is logged in and knows the property's latest status.

Postcondition: The system saves the new status and its history, then displays the latest status.
Main flow
1. The agent opens อสังหาริมทรัพย์. Execute Q8.1: SELECT to display properties and their current statuses.
2. The agent selects a property and clicks เปลี่ยนสถานะ. Display that property's details, current status, and a new-status selector.
3. The agent selects ว่าง, กำลังดำเนินการ, or ขายแล้ว. Show the selected value on the form without changing the database yet.
4. The agent reviews the information and clicks บันทึกสถานะ. Check that a property is selected and the new status is one of the allowed values.
5. Execute Q8.2: UPDATE to change the selected property's status and Q8.3: INSERT to record the old status, new status, and change timestamp. Save both operations consistently so an unsuccessful save does not leave the property and history out of sync.
6. Display บันทึกสถานะสำเร็จ and show the latest status.
Alternative flow
UC8-A1 — Missing or invalid new status at step 4
- Display กรุณาเลือกสถานะเป็น ว่าง กำลังดำเนินการ หรือขายแล้ว.
- Provide กลับไปแก้ไข and return to step 3 at the new-status selector.
- Revalidate at step 4 on resubmission. Continue through steps 5–6 only when valid.