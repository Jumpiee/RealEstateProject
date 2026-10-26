import Link from "next/link";
import { signOut } from "@/app/dashboard/sign-out";
import { getAgent } from "@/lib/agent-auth";

const links = [
  { href: "/properties", label: "อสังหาริมทรัพย์" },
  { href: "/appointments", label: "นัดหมาย" },
  { href: "/customers", label: "ลูกค้า" },
] as const;

export default async function Header() {
  const agent = await getAgent();
  if (!agent) return null;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า
        </Link>
        <nav
          aria-label="เมนูหลัก"
          className="order-3 flex w-full gap-5 overflow-x-auto font-medium text-sm sm:order-none sm:w-auto"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            {agent.username}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border px-3 py-2 transition-colors hover:bg-muted"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
