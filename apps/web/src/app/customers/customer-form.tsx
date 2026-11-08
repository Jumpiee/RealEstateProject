"use client";

import { Button } from "@RealEstateProject/ui/components/button";
import { Input } from "@RealEstateProject/ui/components/input";
import { Textarea } from "@RealEstateProject/ui/components/textarea";
import { useActionState, useEffect, useRef, useState } from "react";
import { type CustomerFormState, createCustomer } from "./actions";

const initialState: CustomerFormState = {};
const field = "h-10 rounded-md bg-background px-3 text-sm";

export default function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, initialState);
  const [open, setOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const requirementsRef = useRef<HTMLTextAreaElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const incomeRef = useRef<HTMLInputElement>(null);
  const value = (name: string) => state.values?.[name] ?? "";
  const errors = showErrors ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.error) setShowErrors(true);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    nameRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !errors) return;
    if (errors.name) nameRef.current?.focus();
    else if (errors.phone) phoneRef.current?.focus();
    else if (errors.requirements) requirementsRef.current?.focus();
    else if (errors.budget) budgetRef.current?.focus();
    else if (errors.income) incomeRef.current?.focus();
  }, [open, errors]);

  const error = (name: string) =>
    errors?.[name] && (
      <span
        id={`customer-${name}-error`}
        className="font-normal text-red-700 text-sm"
      >
        {errors[name]}
      </span>
    );

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls="add-customer-dialog"
        className="h-10 rounded-md px-4 text-sm"
      >
        <span aria-hidden="true">＋</span> เพิ่มลูกค้า
      </Button>

      <dialog
        id="add-customer-dialog"
        ref={dialogRef}
        aria-labelledby="add-customer-title"
        onClose={() => {
          setOpen(false);
          setShowErrors(false);
        }}
        className="fixed inset-0 m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
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
          <h2 id="add-customer-title" className="pr-10 font-semibold text-xl">
            เพิ่มลูกค้า
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
            <label
              htmlFor="customer-name"
              className="grid gap-2 font-medium text-sm"
            >
              ชื่อลูกค้า
              <Input
                id="customer-name"
                ref={nameRef}
                name="name"
                defaultValue={value("name")}
                aria-invalid={Boolean(errors?.name)}
                aria-describedby={
                  errors?.name ? "customer-name-error" : undefined
                }
                className={field}
              />
              {error("name")}
            </label>
            <label
              htmlFor="customer-phone"
              className="grid gap-2 font-medium text-sm"
            >
              เบอร์โทรศัพท์
              <Input
                id="customer-phone"
                ref={phoneRef}
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                defaultValue={value("phone")}
                aria-invalid={Boolean(errors?.phone)}
                aria-describedby={
                  errors?.phone ? "customer-phone-error" : undefined
                }
                className={field}
                placeholder="ตัวเลข 10 หลัก"
              />
              {error("phone")}
            </label>
            <label
              htmlFor="customer-requirements"
              className="grid gap-2 font-medium text-sm sm:col-span-2"
            >
              ความต้องการ (ถ้ามี)
              <Textarea
                id="customer-requirements"
                ref={requirementsRef}
                name="requirements"
                rows={3}
                defaultValue={value("requirements")}
                aria-invalid={Boolean(errors?.requirements)}
                aria-describedby={
                  errors?.requirements
                    ? "customer-requirements-error"
                    : undefined
                }
                className="min-h-24 rounded-md bg-background px-3 py-2 text-sm"
              />
              {error("requirements")}
            </label>
            <label
              htmlFor="customer-budget"
              className="grid gap-2 font-medium text-sm"
            >
              งบประมาณ
              <Input
                id="customer-budget"
                ref={budgetRef}
                name="budget"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={value("budget")}
                aria-invalid={Boolean(errors?.budget)}
                aria-describedby={
                  errors?.budget
                    ? "customer-budget-hint customer-budget-error"
                    : "customer-budget-hint"
                }
                className={field}
              />
              <span
                id="customer-budget-hint"
                className="font-normal text-muted-foreground text-xs"
              >
                ระบุจำนวนเงินตั้งแต่ 0 บาทขึ้นไป (ทศนิยมไม่เกิน 2 ตำแหน่ง)
              </span>
              {error("budget")}
            </label>
            <label
              htmlFor="customer-income"
              className="grid gap-2 font-medium text-sm"
            >
              รายได้
              <Input
                id="customer-income"
                ref={incomeRef}
                name="income"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={value("income")}
                aria-invalid={Boolean(errors?.income)}
                aria-describedby={
                  errors?.income
                    ? "customer-income-hint customer-income-error"
                    : "customer-income-hint"
                }
                className={field}
              />
              <span
                id="customer-income-hint"
                className="font-normal text-muted-foreground text-xs"
              >
                ระบุจำนวนเงินตั้งแต่ 0 บาทขึ้นไป (ทศนิยมไม่เกิน 2 ตำแหน่ง)
              </span>
              {error("income")}
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
                {pending ? "กำลังบันทึก…" : "บันทึก"}
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
