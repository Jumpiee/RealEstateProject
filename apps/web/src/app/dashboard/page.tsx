import Link from "next/link";

import { requireAgent } from "@/lib/agent-auth";

const menus = [
  { title: "อสังหาริมทรัพย์", description: "บันทึกทรัพย์ ตรวจรายการประกาศ และจัดการสถานะ", href: "/properties", icon: "⌂" },
  { title: "นัดหมาย", description: "ดูและจัดการนัดหมายกับลูกค้าและผู้เกี่ยวข้อง", href: "/appointments", icon: "◷" },
  { title: "ลูกค้า", description: "บันทึกข้อมูลติดต่อและความต้องการของลูกค้า", href: "/customers", icon: "♧" },
] as const;

export default async function DashboardPage() {
  const agent = await requireAgent();

  return (
    <div className="min-h-svh bg-muted/30">
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <p className="text-sm font-medium text-primary">หน้าหลัก</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">ยินดีต้อนรับ, {agent.username}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">จัดการข้อมูลอสังหาริมทรัพย์ นัดหมาย และลูกค้าของคุณได้จากที่นี่</p>
        <section aria-label="เมนูจัดการ" className="mt-9 grid gap-4 md:grid-cols-3">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary">{menu.icon}</span>
              <h2 className="mt-5 text-lg font-semibold">{menu.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{menu.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">เปิดเมนู <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
