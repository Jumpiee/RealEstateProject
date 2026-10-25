import assert from "node:assert/strict";
import test from "node:test";
import {
	parseBangkokDateTimeLocal,
	validateAppointment,
} from "./appointment-validation.ts";

const input = {
	type: "ดูอสังหา",
	relevantPerson: "คุณเอ",
	propertyId: "property-a",
	details: "พาชมบ้าน",
	startAt: "2030-01-02T10:00",
	endAt: "2030-01-02T11:00",
};
const now = new Date("2030-01-01T00:00:00.000Z");

test("accepts a complete future appointment with end after start", () => {
	assert.equal(validateAppointment(input, now).valid, true);
});

test("rejects a past start time", () => {
	const result = validateAppointment(
		{ ...input, startAt: "2020-01-01T10:00" },
		now,
	);
	assert.equal(result.errors.startAt, "วันเวลานัดต้องไม่เป็นอดีต");
	assert.equal(
		result.errors.dateTime,
		"วันเวลานัดต้องไม่เป็นอดีตและเวลาสิ้นสุดต้องหลังเวลาเริ่ม",
	);
});

test("rejects an end time that is not after the start", () => {
	const result = validateAppointment({ ...input, endAt: input.startAt }, now);
	assert.equal(result.errors.endAt, "เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
});

test("rejects missing appointment type or relevant person", () => {
	const result = validateAppointment(
		{ ...input, type: "", relevantPerson: " " },
		now,
	);
	assert.equal(result.errors.type, "กรุณาเลือกประเภทนัดหมาย");
	assert.equal(result.errors.relevantPerson, "กรุณากรอกชื่อผู้เกี่ยวข้อง");
});

test("requires a property for viewing and land department appointments, but not for intake", () => {
	assert.equal(
		validateAppointment({ ...input, propertyId: "", type: "ดูอสังหา" }, now)
			.errors.propertyId,
		"กรุณาเลือกอสังหาริมทรัพย์",
	);
	assert.equal(
		validateAppointment({ ...input, propertyId: "", type: "ไปกรมที่ดิน" }, now)
			.errors.propertyId,
		"กรุณาเลือกอสังหาริมทรัพย์",
	);
	assert.equal(
		validateAppointment(
			{ ...input, propertyId: "", type: "รับข้อมูล/ประเมินอสังหา" },
			now,
		).errors.propertyId,
		undefined,
	);
});

test("interprets datetime-local as Bangkok wall time and converts it to a UTC instant", () => {
	assert.equal(
		parseBangkokDateTimeLocal("2030-01-02T10:15")?.toISOString(),
		"2030-01-02T03:15:00.000Z",
	);
	assert.equal(parseBangkokDateTimeLocal("2030-02-30T10:15"), null);
});
