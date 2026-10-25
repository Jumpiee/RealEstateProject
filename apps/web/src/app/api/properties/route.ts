import prisma from "@RealEstateProject/db";
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { hasNumericValue } from "@/lib/property-validation";

const requiredText = (value: unknown) =>
	typeof value === "string" && value.trim().length > 0;

// UC3 Q3.1 and UC7 Q7.1/Q7.2: select properties for this agent, optionally filtering by a stored status.
export async function GET(request: Request) {
	const agent = await requireAgent();
	const status = new URL(request.url).searchParams.get("status") ?? "ทั้งหมด";
	const allowedFilters = ["ทั้งหมด", "ว่าง", "กำลังดำเนินการ", "ขายแล้ว"];
	if (!allowedFilters.includes(status))
		return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
	const properties = await prisma.property.findMany({
		where: { agentId: agent.id, ...(status === "ทั้งหมด" ? {} : { status }) },
		include: { owner: true, postings: true },
		orderBy: { createdAt: "desc" },
	});
	return NextResponse.json(properties);
}

// UC3 Q3.2 reuses an owner by phone (or creates one); Q3.3 creates the accepted property.
export async function POST(request: Request) {
	const agent = await requireAgent();
	const body = await request.json().catch(() => null);
	const requiredFields = [
		"ownerName",
		"name",
		"type",
		"address",
		"description",
	] as const;
	const missingFields: string[] = body
		? requiredFields.filter((key) => !requiredText(body[key]))
		: [...requiredFields];
	if (body && !hasNumericValue(body.area)) missingFields.push("area");
	if (body && !hasNumericValue(body.price)) missingFields.push("price");
	if (missingFields.length) {
		return NextResponse.json(
			{ error: "กรุณากรอกข้อมูลให้ครบ", fields: missingFields },
			{ status: 400 },
		);
	}
	const phone =
		typeof body.ownerPhone === "string" ? body.ownerPhone.trim() : "";
	if (!/^\d{10}$/.test(phone))
		return NextResponse.json(
			{ error: "เบอร์ติดต่อต้องเป็นตัวเลข 10 หลัก", fields: ["ownerPhone"] },
			{ status: 400 },
		);
	const area =
		typeof body.area === "string" || typeof body.area === "number"
			? Number(body.area)
			: Number.NaN;
	if (!Number.isFinite(area) || area <= 0)
		return NextResponse.json(
			{ error: "พื้นที่ต้องมากกว่า 0", fields: ["area"] },
			{ status: 400 },
		);
	const price =
		typeof body.price === "string" || typeof body.price === "number"
			? Number(body.price)
			: Number.NaN;
	if (!Number.isFinite(price) || price < 0)
		return NextResponse.json(
			{ error: "ราคาต้องไม่ติดลบ", fields: ["price"] },
			{ status: 400 },
		);

	const ownerName = body.ownerName.trim();
	const property = await prisma.$transaction(async (tx) => {
		// Q3.2: scope owner lookup by agent and phone so one agent never reuses another agent's owner.
		const existing = await tx.owner.findUnique({
			where: { agentId_phone: { agentId: agent.id, phone } },
		});
		const owner =
			existing ??
			(await tx.owner.create({
				data: { agentId: agent.id, name: ownerName, phone },
			}));
		return tx.property.create({
			data: {
				agentId: agent.id,
				ownerId: owner.id,
				name: body.name.trim(),
				type: body.type.trim(),
				address: body.address.trim(),
				area,
				price,
				description:
					typeof body.description === "string" ? body.description.trim() : "",
			},
			include: { owner: true, postings: true },
		});
	});
	return NextResponse.json(
		{ message: "บันทึกอสังหาสำเร็จ", property },
		{ status: 201 },
	);
}
