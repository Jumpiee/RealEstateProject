"use client";

import { Button } from "@RealEstateProject/ui/components/button";
import { Input } from "@RealEstateProject/ui/components/input";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type RescheduleAppointmentState,
  rescheduleAppointment,
} from "./actions";

const initialState: RescheduleAppointmentState = {};

export default function RescheduleAppointmentButton({
  appointmentId,
  startAt,
  endAt,
}: {
  appointmentId: string;
  startAt: string;
  endAt: string;
}) {
  const [state, action, pending] = useActionState(
    rescheduleAppointment,
    initialState,
  );
  const [showErrors, setShowErrors] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      dialogRef.current?.close();
      toast.success(state.success);
      router.refresh();
    } else if (state.error) {
      setShowErrors(true);
      if (state.fieldErrors?.startAt) startRef.current?.focus();
      else if (state.fieldErrors?.endAt) endRef.current?.focus();
    }
  }, [router, state]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setShowErrors(false);
          dialogRef.current?.showModal();
          startRef.current?.focus();
        }}
        aria-haspopup="dialog"
        aria-controls={`reschedule-${appointmentId}`}
        aria-label="แก้ไขเวลาเพื่อเลื่อนนัดหมาย"
        className="h-8 rounded-md px-3 text-xs"
      >
        แก้ไข
      </Button>
      <dialog
        id={`reschedule-${appointmentId}`}
        ref={dialogRef}
        aria-labelledby={`reschedule-title-${appointmentId}`}
        onClose={() => {
          setShowErrors(false);
          formRef.current?.reset();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="p-6">
          <h2
            id={`reschedule-title-${appointmentId}`}
            className="font-semibold text-xl"
          >
            เลื่อนนัดหมาย
          </h2>
          <form
            ref={formRef}
            action={action}
            onSubmit={() => setShowErrors(false)}
            noValidate
            className="mt-5 grid gap-4"
          >
            <input type="hidden" name="id" value={appointmentId} />
            {showErrors && state.error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
                {state.error}
              </p>
            )}
            <label className="grid gap-1 font-medium text-sm">
              วันและเวลาเริ่ม
              <Input
                ref={startRef}
                name="startAt"
                type="datetime-local"
                defaultValue={startAt}
                aria-invalid={showErrors && Boolean(state.fieldErrors?.startAt)}
              />
              {showErrors && state.fieldErrors?.startAt && (
                <span className="font-normal text-red-700 text-sm">
                  {state.fieldErrors.startAt}
                </span>
              )}
            </label>
            <label className="grid gap-1 font-medium text-sm">
              วันและเวลาสิ้นสุด
              <Input
                ref={endRef}
                name="endAt"
                type="datetime-local"
                defaultValue={endAt}
                aria-invalid={showErrors && Boolean(state.fieldErrors?.endAt)}
              />
              {showErrors && state.fieldErrors?.endAt && (
                <span className="font-normal text-red-700 text-sm">
                  {state.fieldErrors.endAt}
                </span>
              )}
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogRef.current?.close()}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "กำลังบันทึก…" : "บันทึกนัดหมาย"}
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
