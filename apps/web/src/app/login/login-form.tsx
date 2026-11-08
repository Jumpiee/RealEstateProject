"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@RealEstateProject/ui/components/button";
import { Input } from "@RealEstateProject/ui/components/input";
import { Label } from "@RealEstateProject/ui/components/label";

import { type LoginState, loginAgent } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginForm({ registered }: { registered: boolean }) {
  const [state, formAction, pending] = useActionState(loginAgent, initialState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.error === "invalid") setPassword("");
  }, [state]);

  const message =
    state.error === "required"
      ? "กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ"
      : state.error === "invalid"
        ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
: state.error === "unavailable" ? "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e44\u0e14\u0e49 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48" : null;
  const correctionField =
    state.error === "invalid"
      ? "password"
      : state.error === "required" && !username.trim()
        ? "username"
        : "password";
  const fieldHint =
    state.error === "required"
      ? `ช่องที่ต้องแก้ไข: ${[!username.trim() && "ชื่อผู้ใช้", !password && "รหัสผ่าน"].filter(Boolean).join(", ")}`
      : state.error === "invalid"
        ? "ช่องที่ต้องแก้ไข: รหัสผ่าน"
        : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-5 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-7 shadow-sm sm:p-9">
        <span className="mb-6 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Building2 className="size-5" /></span>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า
        </p>
        <h1 className="font-semibold text-3xl tracking-tight">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          เข้าสู่ระบบด้วยบัญชีของนายหน้า
        </p>
        {registered && (
          <p
            role="status"
            className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            สมัครสมาชิกสำเร็จ
          </p>
        )}
        {message && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <p>{message}</p>
            {fieldHint && <p className="mt-1">{fieldHint}</p>}
          </div>
        )}
        <form id="login-form" action={formAction} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              ชื่อผู้ใช้
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-10 rounded-md px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-md px-3 text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-md text-sm"
          >
            {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>
        </form>
        <p className="mt-6 text-center text-muted-foreground text-sm">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </section>
    </main>
  );
}
