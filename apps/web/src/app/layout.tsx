import type { Metadata } from "next";

import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า",
  description: "ระบบภายในสำหรับนายหน้าอสังหาริมทรัพย์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
