import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { runUseCaseQueryIn, withUseCaseTransaction } from "@RealEstateProject/db";

const statuses = ["available", "in_progress", "sold"];
const transitions: Record<string, string[]> = { available: ["in_progress"], in_progress: ["available", "sold"], sold: [] };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || !statuses.includes(body.status)) return NextResponse.json({ error: "กรุณาเลือกสถานะเป็น ว่าง กำลังดำเนินการ หรือขายแล้ว" }, { status: 400 });
  if (body.confirmed !== true) return NextResponse.json({ error: "กรุณายืนยันข้อมูลการเปลี่ยนสถานะ" }, { status: 400 });
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "กรุณาเลือกอสังหาริมทรัพย์" }, { status: 404 });

  const result = await withUseCaseTransaction(async (tx) => {
    const owned = await runUseCaseQueryIn<{ property_id: bigint }>(tx, "Q8.1", [BigInt(agent.userId)]);
    if (!owned.some((row) => String(row.property_id) === id)) return { kind: "missing" as const };
    const [locked] = await runUseCaseQueryIn<{ property_id: bigint; status: string }>(tx, "Q8.4", [BigInt(id), BigInt(agent.userId)]);
    if (!locked) return { kind: "missing" as const };
    if (!transitions[locked.status]?.includes(body.status)) return { kind: "invalid" as const };
    const updated = await runUseCaseQueryIn<{ property_id: bigint }>(tx, "Q8.2", [body.status, BigInt(id), BigInt(agent.userId), locked.status]);
    if (updated.length !== 1) return { kind: "stale" as const };
    const history = await runUseCaseQueryIn<{ history_id: bigint }>(tx, "Q8.3", [BigInt(id), BigInt(agent.userId), locked.status, body.status]);
    if (history.length !== 1) throw new Error("Status history insert returned no history_id");
    return { kind: "saved" as const, propertyId: String(updated[0].property_id), status: body.status };
  });
  if (result.kind === "missing") return NextResponse.json({ error: "กรุณาเลือกอสังหาริมทรัพย์" }, { status: 404 });
  if (result.kind === "invalid") return NextResponse.json({ error: "ไม่สามารถเปลี่ยนเป็นสถานะที่เลือกได้" }, { status: 400 });
  if (result.kind === "stale") return NextResponse.json({ error: "ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดสถานะใหม่" }, { status: 409 });
  return NextResponse.json({ message: "บันทึกสถานะสำเร็จ", property: { propertyId: result.propertyId, status: result.status } });
}
