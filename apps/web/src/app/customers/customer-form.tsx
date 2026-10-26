"use client";

import { useActionState } from "react";
import { type CustomerFormState, createCustomer } from "./actions";

const initialState: CustomerFormState = {};
const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

export default function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, initialState);
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
      <label className="grid gap-1 font-medium text-sm">
        ชื่อลูกค้า
        <input name="name" defaultValue={value("name")} className={field} />
        {error("name")}
      </label>
      <label className="grid gap-1 font-medium text-sm">
        เบอร์โทรศัพท์
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          defaultValue={value("phone")}
          className={field}
          placeholder="ตัวเลข 10 หลัก"
        />
        {error("phone")}
      </label>
      <label className="grid gap-1 font-medium text-sm sm:col-span-2">
        ความต้องการ
        <textarea
          name="requirements"
          rows={3}
          defaultValue={value("requirements")}
          className={field}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
