"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { loginAgent, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginForm({ registered }: { registered: boolean }) {
  const [state, formAction, pending] = useActionState(loginAgent, initialState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.error === "invalid") setPassword("");
  }, [state]);

  const message = state.error === "required"
    ? "กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ"
    : state.error === "invalid"
      ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      : null;

  return (
    <main className="mx-auto flex min-h-[calc(100svh-1px)] w-full max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-2xl border bg-card p-7 shadow-sm sm:p-9">
        <p className="mb-2 text-sm font-medium text-primary">ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า</p>
        <h1 className="text-3xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-muted-foreground">เข้าสู่ระบบด้วยบัญชีของนายหน้า</p>
        {registered && <p role="status" className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">สมัครสมาชิกสำเร็จ</p>}
        {message && <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{message}</p><a className="mt-2 inline-block font-medium underline" href="#login-form">กลับไปแก้ไข</a></div>}
        <form id="login-form" action={formAction} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">ชื่อผู้ใช้</label>
            <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">ยังไม่มีบัญชี? <Link href="/register" className="font-medium text-foreground underline underline-offset-4">สมัครสมาชิก</Link></p>
      </section>
    </main>
  );
}
