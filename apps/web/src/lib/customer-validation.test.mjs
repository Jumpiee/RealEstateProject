import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomer } from "./customer-validation.ts";

test("accepts a customer with a nonblank name and ten digit phone", () => {
	assert.equal(
		validateCustomer({ name: "สมชาย", phone: "0812345678" }).valid,
		true,
	);
});

test("rejects a blank customer name", () => {
	assert.equal(
		validateCustomer({ name: "  ", phone: "0812345678" }).errors.name,
		"กรุณากรอกชื่อลูกค้า",
	);
});

test("rejects phone values that are not exactly ten digits", () => {
	for (const phone of ["812345678", "08123456789", "08123a5678"]) {
		assert.equal(
			validateCustomer({ name: "สมชาย", phone }).errors.phone,
			"เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
		);
	}
});
