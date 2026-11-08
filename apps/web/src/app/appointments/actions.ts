"use server";
import { runPostgresUseCaseQueryIn, withPostgresUseCaseTransaction } from "@RealEstateProject/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { parseBangkokDateTimeLocal } from "@/lib/appointment-validation";

export type AppointmentFormState = { error?: string; fieldErrors?: Record<string,string>; values?: Record<string,string> };
export type RescheduleAppointmentState = { error?: string; fieldErrors?: Record<string,string>; success?: string };
const scheduled = "scheduled";
const rangeStart = new Date("-004712-01-01T00:00:00Z");
const rangeEnd = new Date(8.64e15 - 1);

export async function createAppointment(_state: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const agent = await requireAgent();
  const input = { type: String(formData.get("type") ?? ""), ownerId: String(formData.get("ownerId") ?? ""), buyerId: String(formData.get("buyerId") ?? formData.get("customerId") ?? ""), propertyId: String(formData.get("propertyId") ?? ""), startAt: String(formData.get("startAt") ?? ""), endAt: String(formData.get("endAt") ?? ""), details: String(formData.get("details") ?? "") };
  const start = parseBangkokDateTimeLocal(input.startAt); const end = parseBangkokDateTimeLocal(input.endAt);
  const fieldErrors: Record<string,string> = {};
  if (!["viewing", "transfer"].includes(input.type)) fieldErrors.type = "กรุณาเลือกประเภทนัดหมาย";
  if (!/^\d+$/.test(input.buyerId)) fieldErrors.buyerId = "กรุณาเลือกลูกค้า";
  if (!/^\d+$/.test(input.propertyId)) fieldErrors.propertyId = "กรุณาเลือกอสังหาริมทรัพย์";
  if (input.ownerId && !/^\d+$/.test(input.ownerId)) fieldErrors.ownerId = "กรุณาเลือกเจ้าของ";
  if (!start) fieldErrors.startAt = "กรุณาระบุวันและเวลาเริ่มนัดให้ถูกต้อง";
  else if (start < new Date()) fieldErrors.startAt = "วันเวลานัดต้องไม่เป็นอดีต";
  if (!end) fieldErrors.endAt = "กรุณาระบุเวลาสิ้นสุดให้ถูกต้อง";
  else if (start && end <= start) fieldErrors.endAt = "เวลาสิ้นสุดต้องหลังเวลาเริ่ม";
  const values = { ...input };
  if (Object.keys(fieldErrors).length) return { error: "กรุณาตรวจสอบวันและเวลานัด", fieldErrors, values };

  const result = await withPostgresUseCaseTransaction(async (tx) => {
    await runPostgresUseCaseQueryIn(tx, "Q5.7", [BigInt(agent.userId)]);
    const [buyerRows, propertyRows] = await Promise.all([
      runPostgresUseCaseQueryIn<{buyer_id:bigint}>(tx, "Q5.5", [BigInt(agent.userId)]),
      runPostgresUseCaseQueryIn<{property_id:bigint;owner_id:bigint}>(tx, "Q5.6", [BigInt(agent.userId)]),
    ]);
    if (!buyerRows.some((row) => String(row.buyer_id) === input.buyerId)) return { kind: "buyer" as const };
    const property = propertyRows.find((row) => String(row.property_id) === input.propertyId);
    if (!property || (input.ownerId && String(property.owner_id) !== input.ownerId)) return { kind: "property" as const };
    const conflicts = await runPostgresUseCaseQueryIn(tx, "Q5.2", [BigInt(agent.userId), start!, end!, null]);
    if (conflicts.length) return { kind: "conflict" as const };
    const [created] = await runPostgresUseCaseQueryIn<{appointment_id:bigint}>(tx, "Q5.3", [BigInt(agent.userId), input.ownerId ? BigInt(input.ownerId) : null, BigInt(input.buyerId), BigInt(input.propertyId), input.type, start!, end!, input.details.trim() || null]);
    if (!created) throw new Error("Q5.3 did not return appointment_id");
    return { kind: "saved" as const };
  });
  if (result.kind === "buyer") return { error: "ไม่พบข้อมูลลูกค้าที่เลือก", fieldErrors: { buyerId: "ไม่พบข้อมูลลูกค้าที่เลือก" }, values };
  if (result.kind === "property") return { error: "ไม่พบข้อมูลอสังหาหรือเจ้าของที่เลือก", fieldErrors: { propertyId: "กรุณาแก้ไขข้อมูลอสังหาริมทรัพย์" }, values };
  if (result.kind === "conflict") return { error: "เวลานี้คุณมีนัดอื่นอยู่แล้ว", fieldErrors: { startAt: "เลือกวันหรือเวลาใหม่", endAt: "เลือกวันหรือเวลาใหม่" }, values };
  revalidatePath("/appointments"); redirect("/appointments?saved=1");
}

async function updateScheduled(formData: FormData, mode: "reschedule" | "completed" | "cancelled") {
  const agent = await requireAgent(); const id = String(formData.get("id") ?? "");
  if (!/^\d+$/.test(id)) return { error: "ไม่พบรายการนัดหมายที่ต้องการแก้ไข" };
  const result = await withPostgresUseCaseTransaction(async (tx) => {
    await runPostgresUseCaseQueryIn(tx, "Q5.7", [BigInt(agent.userId)]);
    const all = await runPostgresUseCaseQueryIn<any>(tx, "Q5.1", [BigInt(agent.userId), rangeStart, rangeEnd]);
    const appointment = all.find((row) => String(row.appointment_id) === id && row.status === scheduled);
    if (!appointment) return { kind: "missing" as const };
    const start = mode === "reschedule" ? parseBangkokDateTimeLocal(String(formData.get("startAt") ?? "")) : new Date(appointment.appointment_at);
    const end = mode === "reschedule" ? parseBangkokDateTimeLocal(String(formData.get("endAt") ?? "")) : new Date(appointment.end_at);
    if (!start || !end || end <= start || (mode === "reschedule" && start < new Date())) return { kind: "invalid" as const };
    if (mode === "reschedule" && (await runPostgresUseCaseQueryIn(tx, "Q5.2", [BigInt(agent.userId), start, end, BigInt(id)])).length) return { kind: "conflict" as const };
    const status = mode === "reschedule" ? scheduled : mode;
    const [updated] = await runPostgresUseCaseQueryIn<{appointment_id:bigint}>(tx, "Q5.8", [start, end, status, appointment.details, BigInt(id), BigInt(agent.userId)]);
    return updated ? { kind: "saved" as const } : { kind: "missing" as const };
  });
  if (result.kind === "conflict") return { error: "เวลานี้คุณมีนัดอื่นอยู่แล้ว" };
  if (result.kind === "invalid") return { error: "วันเวลานัดต้องไม่เป็นอดีตและเวลาสิ้นสุดต้องหลังเวลาเริ่ม" };
  if (result.kind !== "saved") return { error: "ไม่พบรายการนัดหมายที่ต้องการแก้ไข" };
  revalidatePath("/appointments");
  return { success: mode === "reschedule" ? "เลื่อนนัดหมายสำเร็จ" : "อัปเดตสถานะนัดหมายสำเร็จ" };
}

export async function rescheduleAppointment(_state: RescheduleAppointmentState, formData: FormData): Promise<RescheduleAppointmentState> { return updateScheduled(formData, "reschedule"); }
export async function completeAppointment(_state: RescheduleAppointmentState, formData: FormData): Promise<RescheduleAppointmentState> { return updateScheduled(formData, "completed"); }
export async function cancelAppointment(_state: RescheduleAppointmentState, formData: FormData): Promise<RescheduleAppointmentState> { return updateScheduled(formData, "cancelled"); }
