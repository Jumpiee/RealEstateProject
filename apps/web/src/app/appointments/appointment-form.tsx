"use client";

import { useActionState } from "react";
import { APPOINTMENT_TYPES } from "@/lib/appointment-validation";
import { type AppointmentFormState, createAppointment } from "./actions";

type Choice = { id: string; name: string };
const initialState: AppointmentFormState = {};
const field =
	"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

export default function AppointmentForm({
	customers,
	properties,
}: {
	customers: Choice[];
	properties: Choice[];
}) {
	const [state, action, pending] = useActionState(
		createAppointment,
		initialState,
	);
	const value = (name: string) => state.values?.[name] ?? "";
	const error = (name: string) =>
		state.fieldErrors?.[name] && (
			<span className="font-normal text-red-700 text-sm">
				{state.fieldErrors[name]}
			</span>
		);
	return (
		<form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
			{state.error && (
				<p
					role="alert"
					className="rounded-lg bg-red-50 p-3 text-red-800 sm:col-span-2"
				>
					{state.error} กรุณากลับไปแก้ไขข้อมูลแล้วบันทึกอีกครั้ง
				</p>
			)}
			{state.fieldErrors?.dateTime && (
				<p className="rounded-lg bg-amber-50 p-3 text-amber-900 sm:col-span-2">
					{state.fieldErrors.dateTime}
				</p>
			)}
			<label className="grid gap-1 font-medium text-sm">
				ประเภทนัดหมาย
				<select name="type" defaultValue={value("type")} className={field}>
					<option value="">เลือกประเภท</option>
					{APPOINTMENT_TYPES.map((type) => (
						<option key={type}>{type}</option>
					))}
				</select>
				{error("type")}
			</label>
			<label className="grid gap-1 font-medium text-sm">
				ผู้เกี่ยวข้อง
				<input
					name="relevantPerson"
					defaultValue={value("relevantPerson")}
					className={field}
					placeholder="ชื่อลูกค้า/ผู้เกี่ยวข้อง"
				/>
				{error("relevantPerson")}
			</label>
			<label className="grid gap-1 font-medium text-sm">
				ลูกค้า (ถ้ามี)
				<select
					name="customerId"
					defaultValue={value("customerId")}
					className={field}
				>
					<option value="">ไม่ระบุ</option>
					{customers.map((customer) => (
						<option key={customer.id} value={customer.id}>
							{customer.name}
						</option>
					))}
				</select>
				{error("customerId")}
			</label>
			<label className="grid gap-1 font-medium text-sm">
				อสังหาริมทรัพย์ (จำเป็นสำหรับนัดดูอสังหาฯ/กรมที่ดิน)
				<select
					name="propertyId"
					defaultValue={value("propertyId")}
					className={field}
				>
					<option value="">ไม่ระบุ</option>
					{properties.map((property) => (
						<option key={property.id} value={property.id}>
							{property.name}
						</option>
					))}
				</select>
				{error("propertyId")}
			</label>
			<label className="grid gap-1 font-medium text-sm">
				วันและเวลาเริ่ม
				<input
					name="startAt"
					type="datetime-local"
					defaultValue={value("startAt")}
					className={field}
				/>
				{error("startAt")}
			</label>
			<label className="grid gap-1 font-medium text-sm">
				วันและเวลาสิ้นสุด
				<input
					name="endAt"
					type="datetime-local"
					defaultValue={value("endAt")}
					className={field}
				/>
				{error("endAt")}
			</label>
			<label className="grid gap-1 font-medium text-sm sm:col-span-2">
				รายละเอียด
				<textarea
					name="details"
					rows={3}
					defaultValue={value("details")}
					className={field}
				/>
				{error("details")}
			</label>
			<button
				disabled={pending}
				className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
			>
				{pending ? "กำลังบันทึก…" : "บันทึกนัดหมาย"}
			</button>
		</form>
	);
}
