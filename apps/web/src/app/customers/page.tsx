import prisma from "@RealEstateProject/db";
import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import CustomerForm from "./customer-form";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const agent = await requireAgent();
  const { saved } = await searchParams;
  // Q6.1: list customers owned by the authenticated agent.
  const customers = await prisma.customer.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-700 text-sm">
          ← หน้าหลัก
        </Link>
        <h1 className="mt-2 font-bold text-2xl">ลูกค้า</h1>
        <p className="mt-1 text-slate-600">บันทึกข้อมูลติดต่อและความต้องการของลูกค้า</p>
      </div>
      {saved && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-green-800"
        >
          บันทึกข้อมูลลูกค้าสำเร็จ
        </p>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-lg">เพิ่มลูกค้า</h2>
        <CustomerForm />
      </section>
      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-lg">รายชื่อลูกค้า</h2>
        {customers.length === 0 ? (
          <p className="rounded-xl border border-slate-300 border-dashed p-6 text-center text-slate-500">
            ยังไม่มีข้อมูลลูกค้า
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <h3 className="font-semibold">{customer.name}</h3>
                <p className="mt-1 text-slate-600 text-sm">{customer.phone}</p>
                {customer.requirements && (
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {customer.requirements}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
