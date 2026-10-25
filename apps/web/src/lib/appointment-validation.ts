export const APPOINTMENT_TYPES = [
	"รับข้อมูล/ประเมินอสังหา",
	"ดูอสังหา",
	"ไปกรมที่ดิน",
] as const;

export type AppointmentInput = {
	type: string;
	relevantPerson: string;
	customerId?: string;
	propertyId?: string;
	startAt: string;
	endAt: string;
	details?: string;
};

/** Interpret a datetime-local wall time in Bangkok (fixed UTC+07:00, no DST). */
export function parseBangkokDateTimeLocal(value: string): Date | null {
	const match =
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
			value,
		);
	if (!match) return null;
	const [
		,
		yearText,
		monthText,
		dayText,
		hourText,
		minuteText,
		secondText = "0",
		millisText = "0",
	] = match;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const hour = Number(hourText);
	const minute = Number(minuteText);
	const second = Number(secondText);
	const millis = Number(millisText.padEnd(3, "0"));
	const wallClock = new Date(
		Date.UTC(year, month - 1, day, hour, minute, second, millis),
	);
	if (
		wallClock.getUTCFullYear() !== year ||
		wallClock.getUTCMonth() !== month - 1 ||
		wallClock.getUTCDate() !== day ||
		wallClock.getUTCHours() !== hour ||
		wallClock.getUTCMinutes() !== minute ||
		wallClock.getUTCSeconds() !== second
	)
		return null;
	return new Date(wallClock.getTime() - 7 * 60 * 60 * 1000);
}

export function validateAppointment(input: AppointmentInput, now = new Date()) {
	const errors: Record<string, string> = {};
	if (
		!APPOINTMENT_TYPES.includes(
			input.type as (typeof APPOINTMENT_TYPES)[number],
		)
	)
		errors.type = "กรุณาเลือกประเภทนัดหมาย";
	if (!input.relevantPerson.trim())
		errors.relevantPerson = "กรุณากรอกชื่อผู้เกี่ยวข้อง";
	if (!input.details?.trim()) errors.details = "กรุณากรอกรายละเอียดนัดหมาย";
	if (
		(input.type === "ดูอสังหา" || input.type === "ไปกรมที่ดิน") &&
		!input.propertyId
	)
		errors.propertyId = "กรุณาเลือกอสังหาริมทรัพย์";
	const parsedStart = parseBangkokDateTimeLocal(input.startAt);
	const parsedEnd = parseBangkokDateTimeLocal(input.endAt);
	const start = parsedStart ?? new Date(Number.NaN);
	const end = parsedEnd ?? new Date(Number.NaN);
	if (!parsedStart) errors.startAt = "กรุณาระบุวันและเวลาเริ่มนัดให้ถูกต้อง";
	else if (start < now) errors.startAt = "วันเวลานัดต้องไม่เป็นอดีต";
	if (!parsedEnd) errors.endAt = "กรุณาระบุเวลาสิ้นสุดให้ถูกต้อง";
	else if (parsedStart && end <= start) errors.endAt = "เวลาสิ้นสุดต้องหลังเวลาเริ่ม";
	if (errors.startAt || errors.endAt)
		errors.dateTime = "วันเวลานัดต้องไม่เป็นอดีตและเวลาสิ้นสุดต้องหลังเวลาเริ่ม";
	return { valid: Object.keys(errors).length === 0, errors, start, end };
}
