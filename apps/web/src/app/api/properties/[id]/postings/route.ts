import prisma from "@RealEstateProject/db";
import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";

const websites = ["DDproperty", "LivingInsider", "Facebook"];

// UC4 Q4.2/Q4.3: read checklist or mark the agent's successful manual post with its date.
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	const agent = await requireAgent();
	const { id } = await context.params;
	const property = await prisma.property.findFirst({
		where: { id, agentId: agent.id },
		include: { postings: true },
	});
	if (!property)
		return NextResponse.json({ error: "ไม่พบข้อมูลอสังหา" }, { status: 404 });
	return NextResponse.json({ property, websites });
}

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	const agent = await requireAgent();
	const { id } = await context.params;
	const body = await request.json().catch(() => null);
	if (!body || !websites.includes(body.website))
		return NextResponse.json({ error: "กรุณาเลือกเว็บไซต์" }, { status: 400 });
	const property = await prisma.property.findFirst({
		where: { id, agentId: agent.id },
		select: { id: true },
	});
	if (!property)
		return NextResponse.json({ error: "ไม่พบข้อมูลอสังหา" }, { status: 404 });
	const posting = await prisma.propertyPosting.upsert({
		where: { propertyId_website: { propertyId: id, website: body.website } },
		create: {
			propertyId: id,
			website: body.website,
			status: "ลงแล้ว",
			postedAt: new Date(),
		},
		update: { status: "ลงแล้ว", postedAt: new Date() },
	});
	return NextResponse.json({ message: "บันทึกเว็บไซต์ที่ลงประกาศแล้ว", posting });
}
