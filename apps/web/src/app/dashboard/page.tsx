import { ArrowUpRight, Building2, CalendarDays, Users } from "lucide-react";
import Link from "next/link";

import { requireAgent } from "@/lib/agent-auth";

const menus = [
  {
    title: "อสังหาริมทรัพย์",
    description: "บันทึกทรัพย์ ตรวจรายการประกาศ และจัดการสถานะ",
    href: "/properties",
    icon: Building2,
  },
  {
    title: "นัดหมาย",
    description: "ดูและจัดการนัดหมายของคุณ",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "ลูกค้า",
    description: "บันทึกข้อมูลติดต่อและความต้องการของลูกค้า",
    href: "/customers",
    icon: Users,
  },
] as const;

export default async function DashboardPage() {
  const agent = await requireAgent();

  return (
    <div className="min-h-[calc(100svh-66px)] bg-muted/30">
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <p className="font-medium text-muted-foreground text-sm">หน้าหลัก</p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight sm:text-4xl">
          ยินดีต้อนรับ, {agent.username}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          จัดการข้อมูลอสังหาริมทรัพย์ นัดหมาย และลูกค้าของคุณได้จากที่นี่
        </p>
        <section
          aria-label="เมนูจัดการ"
          className="mt-9 grid gap-4 md:grid-cols-3"
        >
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-foreground/25 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-lg border bg-muted text-foreground"
              >
                <menu.icon className="size-5" />
              </span>
              <h2 className="mt-5 font-semibold text-lg">{menu.title}</h2>
              <p className="mt-2 min-h-12 text-muted-foreground text-sm leading-6">
                {menu.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-medium text-foreground text-sm">
                เปิดเมนู{" "}
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
