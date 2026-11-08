import Link from "next/link";
import { Building2, CalendarDays, LogOut, Users } from "lucide-react";
import { Button } from "@RealEstateProject/ui/components/button";
import { signOut } from "@/app/dashboard/sign-out";
import { getAgent } from "@/lib/agent-auth";

const links = [
  { href: "/properties", label: "อสังหาริมทรัพย์", icon: Building2 },
  { href: "/appointments", label: "นัดหมาย", icon: CalendarDays },
  { href: "/customers", label: "ลูกค้า", icon: Users },
] as const;

export default async function Header() {
  const agent = await getAgent();
  if (!agent) return null;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Building2 className="size-5" /></span>
          <span className="max-w-48 leading-tight sm:max-w-none">ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า</span>
        </Link>
        <nav
          aria-label="เมนูหลัก"
          className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            {agent.username}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="h-9 gap-2 rounded-md px-3 text-sm">
              <LogOut className="size-4" aria-hidden="true" />
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
