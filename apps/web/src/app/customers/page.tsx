import Link from "next/link";
import { requireAgent } from "@/lib/agent-auth";
import { listCustomers } from "@/lib/data-service";
import CustomerForm from "./customer-form";

function formatMoney(value: string) {
  const [integer = "0", fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; phone?: string }>;
}) {
  const agent = await requireAgent();
  const { saved, phone = "" } = await searchParams;
  // Q6.1: list customers owned by the authenticated agent.
  const customers = await listCustomers(agent.userId, phone || null);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← หน้าหลัก
          </Link>
          <h1 className="mt-2 font-semibold text-3xl tracking-tight">ลูกค้า</h1>
          <p className="mt-1 text-muted-foreground">
            บันทึกข้อมูลติดต่อและความต้องการของลูกค้า
          </p>
        </div>
        <CustomerForm />
      </div>
      {saved && (
        <p
          role="status"
          className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800"
        >
          บันทึกข้อมูลลูกค้าสำเร็จ
        </p>
      )}
      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-lg">รายชื่อลูกค้า</h2>
        <form method="get" className="mb-4 flex max-w-lg gap-2">
          <label htmlFor="customer-phone-filter" className="sr-only">กรองตามเบอร์โทรศัพท์</label>
          <input id="customer-phone-filter" name="phone" inputMode="numeric" defaultValue={phone} placeholder="ค้นหาด้วยเบอร์โทรศัพท์" className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" />
          <button type="submit" className="rounded-md border px-4 text-sm">ค้นหา</button>
          {phone && <a href="/customers" className="inline-flex items-center rounded-md border px-4 text-sm">ล้าง</a>}
        </form>
        {customers.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
            ยังไม่มีข้อมูลลูกค้า
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customers.map((customer) => (
              <article
                key={customer.buyerId}
                className="rounded-lg border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{customer.name}</h3>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  {customer.phone}
                </p>
                {customer.budget !== null && (
                  <p className="mt-3 text-sm">
                    งบประมาณ: ฿{formatMoney(customer.budget.toString())}
                  </p>
                )}
                {customer.income !== null && (
                  <p className="mt-1 text-sm">
                    รายได้: ฿{formatMoney(customer.income.toString())}
                  </p>
                )}
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
