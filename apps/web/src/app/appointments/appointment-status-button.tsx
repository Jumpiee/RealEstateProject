"use client";

import { Button } from "@RealEstateProject/ui/components/button";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  cancelAppointment,
  completeAppointment,
  type RescheduleAppointmentState,
} from "./actions";

const initialState: RescheduleAppointmentState = {};

export default function AppointmentStatusButton({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: "completed" | "cancelled";
}) {
  const action = status === "completed" ? completeAppointment : cancelAppointment;
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();
  const label = status === "completed" ? "ทำเครื่องหมายว่าเสร็จสิ้น" : "ยกเลิกนัดหมาย";

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="grid justify-items-end gap-2">
      <input type="hidden" name="id" value={appointmentId} />
      <Button type="submit" variant="outline" disabled={pending} className="h-8 rounded-md px-3 text-xs">
        {pending ? "กำลังบันทึก…" : label}
      </Button>
      {state.error && <p role="alert" className="max-w-60 text-right text-destructive text-sm">{state.error}</p>}
    </form>
  );
}
