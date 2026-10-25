import prisma from "@RealEstateProject/db";
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";

const validStatuses = ["ว่าง", "กำลังดำเนินการ", "ขายแล้ว"];

// UC8 Q8.2 and Q8.3: update the status and insert its history in one transaction.
export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	const agent = await requireAgent();
	const { id } = await context.params;
	const body = await request.json().catch(() => null);
	if (!body || !validStatuses.includes(body.status)) {
		return NextResponse.json(
			{ error: "กรุณาเลือกสถานะเป็น ว่าง กำลังดำเนินการ หรือขายแล้ว." },
			{ status: 400 },
		);
	}
	const saved = await prisma.$transaction(async (tx) => {
		const property = await tx.property.findFirst({
			where: { id, agentId: agent.id },
			select: { id: true, status: true },
		});
		if (!property) return null;
		const updated = await tx.property.update({
			where: { id: property.id },
			data: { status: body.status },
		});
		await tx.propertyStatusHistory.create({
			data: {
				propertyId: property.id,
				oldStatus: property.status,
				newStatus: body.status,
				changedAt: new Date(),
			},
		});
		return updated;
	});
	if (!saved)
		return NextResponse.json({ error: "กรุณาเลือกอสังหา" }, { status: 404 });
	return NextResponse.json({ message: "บันทึกสถานะสำเร็จ", property: saved });
}
