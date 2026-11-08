import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { getAppointmentChoices, listAppointments } from "@/lib/data-service";
import AppointmentForm from "./appointment-form";
import RescheduleAppointmentButton from "./reschedule-appointment-button";
import AppointmentStatusButton from "./appointment-status-button";

function bangkokDateTimeLocal(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function formatBangkok(value: string) {
  return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

const appointmentTypeLabels: Record<string, string> = {
  viewing: "นัดชม",
  transfer: "นัดโอน",
};
const statusLabels: Record<string, string> = {
  scheduled: "นัดแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิกแล้ว",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const agent = await requireAgent();
  const { saved } = await searchParams;
  const [appointments, choices] = await Promise.all([
    listAppointments(agent.userId),
    getAppointmentChoices(agent.userId),
  ]);
  const buyers = choices.buyers.map(({ buyerId, name, phone }) => ({
    id: buyerId,
    name,
    phone,
  }));
  const owners = choices.owners.map(({ ownerId, name, phone }) => ({ id: ownerId, name, phone }));
  const properties = choices.properties.map(({ propertyId, name }) => ({
    id: propertyId,
    name,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:text-foreground">
            ← หน้าหลัก
          </Link>
          <h1 className="mt-2 font-semibold text-3xl tracking-tight">นัดหมาย</h1>
          <p className="mt-1 text-muted-foreground">บันทึกและตรวจสอบนัดหมายของคุณ</p>
        </div>
        <AppointmentForm customers={buyers} owners={owners} properties={properties} />
      </div>
      {saved && (
        <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          บันทึกนัดหมายสำเร็จ
        </p>
      )}
      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-lg">รายการนัดหมาย</h2>
        {appointments.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">ยังไม่มีนัดหมาย</p>
        ) : (
          <div className="grid gap-3">
            {appointments.map((appointment) => (
              <article key={appointment.appointmentId} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{appointmentTypeLabels[appointment.appointmentType] ?? appointment.appointmentType}</h3>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {formatBangkok(appointment.appointmentAt)} – {formatBangkok(appointment.endAt)}
                    </p>
                    <p className="mt-1 text-muted-foreground text-sm">
                      {owners.find((owner) => owner.id === appointment.ownerId)?.name
                        ?? buyers.find((buyer) => buyer.id === appointment.buyerId)?.name
                        ?? "ไม่ระบุผู้เกี่ยวข้อง"}
                      {" · "}
                      {properties.find((property) => property.id === appointment.propertyId)?.name ?? "ไม่ระบุอสังหาริมทรัพย์"}
                    </p>
                  </div>
                  <span className="rounded-md border bg-muted px-2.5 py-1 font-medium text-xs">
                    {statusLabels[appointment.status] ?? appointment.status}
                  </span>
                  {appointment.status === "scheduled" && (
                    <div className="flex flex-wrap items-start gap-2">
                      <RescheduleAppointmentButton
                        appointmentId={appointment.appointmentId}
                        startAt={bangkokDateTimeLocal(appointment.appointmentAt)}
                        endAt={bangkokDateTimeLocal(appointment.endAt)}
                      />
                      <AppointmentStatusButton appointmentId={appointment.appointmentId} status="completed" />
                      <AppointmentStatusButton appointmentId={appointment.appointmentId} status="cancelled" />
                    </div>
                  )}
                </div>
                {appointment.details && <p className="mt-2 whitespace-pre-wrap text-sm">{appointment.details}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
