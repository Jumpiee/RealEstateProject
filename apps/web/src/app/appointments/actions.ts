"use server";

import prisma from "@RealEstateProject/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { validateAppointment } from "@/lib/appointment-validation";

export type AppointmentFormState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	values?: Record<string, string>;
};

export async function createAppointment(
	_previousState: AppointmentFormState,
	formData: FormData,
): Promise<AppointmentFormState> {
	const agent = await requireAgent();
	const input = {
		type: String(formData.get("type") ?? ""),
		relevantPerson: String(formData.get("relevantPerson") ?? ""),
		customerId: String(formData.get("customerId") ?? "") || undefined,
		propertyId: String(formData.get("propertyId") ?? "") || undefined,
		startAt: String(formData.get("startAt") ?? ""),
		endAt: String(formData.get("endAt") ?? ""),
		details: String(formData.get("details") ?? ""),
	};
	const checked = validateAppointment(input);
	const values = {
		type: input.type,
		relevantPerson: input.relevantPerson,
		customerId: input.customerId ?? "",
		propertyId: input.propertyId ?? "",
		startAt: input.startAt,
		endAt: input.endAt,
		details: input.details ?? "",
	};
	if (!checked.valid)
		return {
			error: "กรุณาตรวจสอบข้อมูลที่ระบุ",
			fieldErrors: checked.errors,
			values,
		};
	if (input.customerId) {
		const found = await prisma.customer.findFirst({
			where: { id: input.customerId, agentId: agent.id },
			select: { id: true },
		});
		if (!found)
			return {
				error: "ไม่พบข้อมูลลูกค้าที่เลือก กรุณาแก้ไขข้อมูลลูกค้า",
				fieldErrors: { customerId: "ไม่พบข้อมูลลูกค้าที่เลือก" },
				values,
			};
	}
	if (input.propertyId) {
		const found = await prisma.property.findFirst({
			where: { id: input.propertyId, agentId: agent.id },
			select: { id: true },
		});
		if (!found)
			return {
				error: "ไม่พบอสังหาฯ ที่เลือก กรุณาแก้ไขข้อมูลอสังหาริมทรัพย์",
				fieldErrors: { propertyId: "ไม่พบอสังหาฯ ที่เลือก" },
				values,
			};
	}
	// Q5.2: overlap check, scoped to this agent. Adjacent appointments are allowed.
	const conflict = await prisma.appointment.findFirst({
		where: {
			agentId: agent.id,
			startAt: { lt: checked.end },
			endAt: { gt: checked.start },
		},
		select: { id: true },
	});
	if (conflict)
		return {
			error: "เวลานี้คุณมีนัดอื่นอยู่แล้ว",
			fieldErrors: { startAt: "เลือกวันหรือเวลาใหม่", endAt: "เลือกวันหรือเวลาใหม่" },
			values,
		};
	// Q5.3: persist appointment with the required initial status after validation and conflict check.
	await prisma.appointment.create({
		data: {
			agentId: agent.id,
			customerId: input.customerId ?? null,
			relevantPerson: input.relevantPerson.trim(),
			propertyId: input.propertyId ?? null,
			type: input.type,
			startAt: checked.start,
			endAt: checked.end,
			details: input.details?.trim() ?? "",
			status: "นัดแล้ว",
		},
	});
	revalidatePath("/appointments");
	redirect("/appointments?saved=1");
}
