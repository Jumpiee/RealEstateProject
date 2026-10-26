import prisma from "@RealEstateProject/db";
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import AppointmentForm from "./appointment-form";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const agent = await requireAgent();
  const { saved } = await searchParams;
  // Q5.1: list appointments belonging to the authenticated agent only.
  const [appointments, customers, properties] = await Promise.all([
    prisma.appointment.findMany({
      where: { agentId: agent.id },
      orderBy: { startAt: "asc" },
    }),
    prisma.customer.findMany({
      where: { agentId: agent.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    prisma.property.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-blue-700 text-sm">
            ← หน้าหลัก
          </Link>
          <h1 className="mt-2 font-bold text-2xl">นัดหมาย</h1>
          <p className="mt-1 text-slate-600">บันทึกและตรวจสอบนัดหมายของคุณ</p>
        </div>
      </div>
      {saved && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-green-800"
        >
          บันทึกนัดหมายสำเร็จ
        </p>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-lg">เพิ่มนัดหมาย</h2>
        <AppointmentForm customers={customers} properties={properties} />
        {appointments.length === 0 && (
          <p className="mt-5 text-slate-500 text-sm">ยังไม่มีนัดหมาย</p>
        )}
      </section>
      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-lg">รายการนัดหมาย</h2>
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {appointment.type} · {appointment.relevantPerson}
                  </h3>
                  <p className="mt-1 text-slate-600 text-sm">
                    {appointment.startAt.toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                    })}{" "}
                    –{" "}
                    {appointment.endAt.toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800 text-sm">
                  {appointment.status}
                </span>
              </div>
              {appointment.details && (
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {appointment.details}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
