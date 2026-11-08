"use client";

import { Button } from "@RealEstateProject/ui/components/button";
import { Input } from "@RealEstateProject/ui/components/input";
import { Textarea } from "@RealEstateProject/ui/components/textarea";
import { useActionState, useEffect, useRef, useState } from "react";
import { type AppointmentFormState, createAppointment } from "./actions";

type Choice = { id: string; name: string };
const appointmentTypes = [
  { value: "viewing", label: "นัดชม" },
  { value: "transfer", label: "นัดโอน" },
];
const initialState: AppointmentFormState = {};
const field =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export default function AppointmentForm({
  customers,
  owners,
  properties,
}: {
  customers: Choice[];
  owners: Choice[];
  properties: Choice[];
}) {
  const [state, action, pending] = useActionState(
    createAppointment,
    initialState,
  );
  const [open, setOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const customerRef = useRef<HTMLSelectElement>(null);
  const propertyRef = useRef<HTMLSelectElement>(null);
  const startAtRef = useRef<HTMLInputElement>(null);
  const endAtRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const value = (name: string) => state.values?.[name] ?? "";
  const errors = showErrors ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.error || state.fieldErrors) setShowErrors(true);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    typeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !errors) return;
    if (errors.type) typeRef.current?.focus();
    else if (errors.buyerId) customerRef.current?.focus();
    else if (errors.propertyId) propertyRef.current?.focus();
    else if (errors.startAt) startAtRef.current?.focus();
    else if (errors.endAt) endAtRef.current?.focus();
    else if (errors.details) detailsRef.current?.focus();
  }, [open, errors]);

  const error = (name: string) =>
    errors?.[name] && (
      <span
        id={`appointment-${name}-error`}
        className="font-normal text-red-700 text-sm"
      >
        {errors[name]}
      </span>
    );

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setShowErrors(false);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-controls="add-appointment-dialog"
        className="h-10 rounded-md px-4 text-sm"
      >
        <span aria-hidden="true">＋</span> เพิ่มนัดหมาย
      </Button>

      <dialog
        id="add-appointment-dialog"
        ref={dialogRef}
        aria-labelledby="add-appointment-title"
        onClose={() => {
          setOpen(false);
          setShowErrors(false);
        }}
        className="fixed inset-0 m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="ปิด"
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-muted-foreground text-xl hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
          <h2
            id="add-appointment-title"
            className="pr-10 font-semibold text-xl"
          >
            เพิ่มนัดหมาย
          </h2>
          <form
            action={action}
            onSubmit={() => setShowErrors(false)}
            noValidate
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            {showErrors && state.error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-red-800 sm:col-span-2"
              >
                {state.error} กรุณากลับไปแก้ไขข้อมูลแล้วบันทึกอีกครั้ง
              </p>
            )}
            {showErrors && state.fieldErrors?.dateTime && (
              <p
                id="appointment-dateTime-error"
                className="rounded-lg bg-amber-50 p-3 text-amber-900 sm:col-span-2"
              >
                {state.fieldErrors.dateTime}
              </p>
            )}
            <label
              htmlFor="appointment-type"
              className="grid gap-1 font-medium text-sm"
            >
              ประเภทนัดหมาย
              <select
                id="appointment-type"
                ref={typeRef}
                name="type"
                defaultValue={value("type")}
                required
                aria-invalid={Boolean(errors?.type)}
                aria-describedby={
                  errors?.type ? "appointment-type-error" : undefined
                }
                className={field}
              >
                <option value="">เลือกประเภท</option>
                {appointmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {error("type")}
            </label>
            <label
              htmlFor="appointment-owner"
              className="grid gap-1 font-medium text-sm"
            >
              เจ้าของ (ถ้ามี)
              <select id="appointment-owner" name="ownerId" defaultValue={value("ownerId")} className={field}>
                <option value="">ไม่ระบุ</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
            </label>
            <label
              htmlFor="appointment-customer"
              className="grid gap-1 font-medium text-sm"
            >
              ลูกค้า
              <select
                id="appointment-customer"
                ref={customerRef}
                name="buyerId"
                defaultValue={value("buyerId")}
                required
                aria-invalid={Boolean(errors?.buyerId)}
                aria-describedby={
                  errors?.buyerId
                    ? "appointment-buyerId-error"
                    : undefined
                }
                className={field}
              >
                <option value="">เลือกลูกค้า</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {error("buyerId")}
            </label>
            <label
              htmlFor="appointment-property"
              className="grid gap-1 font-medium text-sm"
            >
              อสังหาริมทรัพย์ (จำเป็นสำหรับนัดดูอสังหาฯ/กรมที่ดิน)
              <select
                id="appointment-property"
                ref={propertyRef}
                name="propertyId"
                defaultValue={value("propertyId")}
                required
                aria-invalid={Boolean(errors?.propertyId)}
                aria-describedby={
                  errors?.propertyId
                    ? "appointment-propertyId-error"
                    : undefined
                }
                className={field}
              >
                <option value="">เลือกอสังหาริมทรัพย์</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {error("propertyId")}
            </label>
            <label
              htmlFor="appointment-start-at"
              className="grid gap-1 font-medium text-sm"
            >
              วันและเวลาเริ่ม
              <Input
                id="appointment-start-at"
                ref={startAtRef}
                name="startAt"
                type="datetime-local"
                defaultValue={value("startAt")}
                aria-invalid={Boolean(errors?.startAt)}
                aria-describedby={
                  errors?.startAt
                    ? "appointment-startAt-error appointment-dateTime-error"
                    : undefined
                }
                className={field}
              />
              {error("startAt")}
            </label>
            <label
              htmlFor="appointment-end-at"
              className="grid gap-1 font-medium text-sm"
            >
              วันและเวลาสิ้นสุด
              <Input
                id="appointment-end-at"
                ref={endAtRef}
                name="endAt"
                type="datetime-local"
                defaultValue={value("endAt")}
                aria-invalid={Boolean(errors?.endAt)}
                aria-describedby={
                  errors?.endAt
                    ? "appointment-endAt-error appointment-dateTime-error"
                    : undefined
                }
                className={field}
              />
              {error("endAt")}
            </label>
            <label
              htmlFor="appointment-details"
              className="grid gap-1 font-medium text-sm sm:col-span-2"
            >
              รายละเอียด
              <Textarea
                id="appointment-details"
                ref={detailsRef}
                name="details"
                rows={3}
                defaultValue={value("details")}
                aria-invalid={Boolean(errors?.details)}
                aria-describedby={
                  errors?.details ? "appointment-details-error" : undefined
                }
                className="min-h-24 rounded-md bg-background px-3 py-2 text-sm"
              />
              {error("details")}
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogRef.current?.close()}
                className="h-10 rounded-md px-4 text-sm"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="h-10 rounded-md px-4 text-sm"
              >
                {pending ? "กำลังบันทึก…" : "บันทึกนัดหมาย"}
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
