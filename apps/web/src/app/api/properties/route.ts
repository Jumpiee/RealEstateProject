import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { listProperties, listPropertiesByStatus } from "@/lib/data-service";
import { runUseCaseQuery, runUseCaseQueryIn, withUseCaseTransaction } from "@RealEstateProject/db";

const statuses = ["available", "in_progress", "sold"];
const websites = ["DDproperty", "LivingInsider", "Facebook"];
const steps = ["เตรียมรายละเอียดประกาศ", "ตรวจข้อมูลก่อนลงประกาศ", "ตรวจช่องทางประกาศ"];
const nonblank = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export async function GET(request: Request) {
  const agent = await requireAgent();
  const status = new URL(request.url).searchParams.get("status");
  if (status && status !== "all" && !statuses.includes(status)) return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  return NextResponse.json(await listProperties(agent.userId, status === "all" ? null : status));
}

export async function POST(request: Request) {
  const agent = await requireAgent();
  const body = await request.json().catch(() => null);
  const fields = ["ownerName", "name", "type", "address"];
  const missing = body ? fields.filter((field) => !nonblank(body[field])) : fields;
  const phone = typeof body?.ownerPhone === "string" ? body.ownerPhone.trim() : "";
  const area = typeof body?.area === "string" ? body.area : String(body?.area ?? "");
  const price = typeof body?.price === "string" ? body.price : String(body?.price ?? "");
  const validDecimal = (value: string, digits: number) => /^\d+(?:\.\d{1,2})?$/.test(value) && value.split(".")[0].replace(/^0+/, "").length <= digits;
  if (!/^\d{10}$/.test(phone)) missing.push("ownerPhone");
  if (!validDecimal(area, 10) || Number(area) <= 0) missing.push("area");
  if (!validDecimal(price, 12) || Number(price) <= 0) missing.push("price");
  if (body && !["house", "condo", "townhouse", "land"].includes(body.type)) missing.push("type");
  if (body && (body.name?.trim().length > 150 || body.ownerName?.trim().length > 150)) missing.push("name");
  if (missing.length) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ", fields: [...new Set(missing)] }, { status: 400 });

  const matches = await runUseCaseQuery<{ owner_id: bigint; name: string; phone: string }>("Q3.4", [BigInt(agent.userId), phone]);
  const chosen = String(body.ownerId ?? "");
  if (matches.length && (!/^\d+$/.test(chosen) || !matches.some((row) => String(row.owner_id) === chosen))) {
    return NextResponse.json({ ownerMatches: matches.map((row) => ({ id: String(row.owner_id), name: row.name, phone: row.phone })) }, { status: 409 });
  }
  const propertyId = await withUseCaseTransaction(async (tx) => {
    const txMatches = await runUseCaseQueryIn<{ owner_id: bigint }>(tx, "Q3.4", [BigInt(agent.userId), phone]);
    let ownerId: bigint;
    if (txMatches.length) {
      if (!txMatches.some((row) => String(row.owner_id) === chosen)) throw new Error("The confirmed owner is no longer available");
      ownerId = BigInt(chosen);
    } else {
      if (chosen) throw new Error("The confirmed owner is no longer available");
      const [owner] = await runUseCaseQueryIn<{ owner_id: bigint }>(tx, "Q3.2", [BigInt(agent.userId), body.ownerName.trim(), phone]);
      if (!owner) throw new Error("Q3.2 returned no owner_id");
      ownerId = owner.owner_id;
    }
    const [property] = await runUseCaseQueryIn<{ property_id: bigint }>(tx, "Q3.3", [BigInt(agent.userId), ownerId, body.name.trim(), body.type, body.address.trim(), area, price, typeof body.description === "string" && body.description.trim() ? body.description.trim() : null]);
    if (!property) throw new Error("Q3.3 returned no property_id");
    for (let i = 0; i < steps.length; i++) if (!(await runUseCaseQueryIn(tx, "Q3.5", [property.property_id, steps[i], i + 1])).length) throw new Error("Q3.5 returned no task_id");
    for (const website of websites) if (!(await runUseCaseQueryIn(tx, "Q3.6", [property.property_id, website])).length) throw new Error("Q3.6 returned no publication_check_id");
    return String(property.property_id);
  });
  return NextResponse.json({ message: "บันทึกอสังหาสำเร็จ", propertyId }, { status: 201 });
}
