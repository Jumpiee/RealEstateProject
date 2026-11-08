import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { getPropertyDetail } from "@/lib/data-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent();
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "ไม่พบข้อมูลอสังหา" }, { status: 404 });
  const result = await getPropertyDetail(agent.userId, id);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "ไม่พบข้อมูลอสังหา" }, { status: 404 });
}
