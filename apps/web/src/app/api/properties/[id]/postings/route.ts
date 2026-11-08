import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { getPropertyDetail } from "@/lib/data-service";
import { runUseCaseQuery } from "@RealEstateProject/db";

const websites = ["DDproperty", "LivingInsider", "Facebook"];
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(); const { id } = await context.params;
  const detail = /^\d+$/.test(id) ? await getPropertyDetail(agent.userId, id) : null;
  return detail ? NextResponse.json({ ...detail, websites }) : NextResponse.json({ error: "ไม่พบข้อมูลอสังหา" }, { status: 404 });
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(); const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const checkId = String(body?.publicationCheckId ?? "");
  const publishedAt = body?.publishedAt ? new Date(body.publishedAt) : null;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(checkId) || !body || typeof body.isPublished !== "boolean" || (body.isPublished && (!publishedAt || Number.isNaN(publishedAt.getTime()))) || (!body.isPublished && publishedAt)) {
    return NextResponse.json({ error: "กรุณาตรวจสอบข้อมูลการประกาศ" }, { status: 400 });
  }
  const rows = await runUseCaseQuery<{ publication_check_id: bigint }>("Q4.3", [body.isPublished, publishedAt, BigInt(checkId), BigInt(id), BigInt(agent.userId)]);
  if (rows.length !== 1) return NextResponse.json({ error: "ไม่พบรายการประกาศที่เลือก" }, { status: 404 });
  return NextResponse.json({ message: "บันทึกเว็บไซต์ที่ลงประกาศแล้ว", publicationCheckId: String(rows[0].publication_check_id), isPublished: body.isPublished, publishedAt: publishedAt?.toISOString() ?? null });
}
