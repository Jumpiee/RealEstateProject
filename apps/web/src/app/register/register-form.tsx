"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAgent, type RegisterState } from "./actions";

const initialState: RegisterState = { error: null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAgent, initialState);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const missing = [!username.trim() && "ชื่อผู้ใช้", !password && "รหัสผ่าน", !confirmation && "ยืนยันรหัสผ่าน"].filter(Boolean);
  const message = state.error === "required"
    ? `กรุณากรอกข้อมูลให้ครบ${missing.length ? `: ${missing.join(", ")}` : ""}`
    : state.error === "short-password"
      ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร (รหัสผ่าน)"
      : state.error === "password-mismatch"
        ? "รหัสผ่านไม่ตรงกัน (รหัสผ่าน, ยืนยันรหัสผ่าน)"
        : state.error === "duplicate"
          ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว (ชื่อผู้ใช้)"
          : null;

  return (
    <main className="mx-auto flex min-h-[calc(100svh-1px)] w-full max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-2xl border bg-card p-7 shadow-sm sm:p-9">
        <p className="mb-2 text-sm font-medium text-primary">ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า</p>
        <h1 className="text-3xl font-semibold tracking-tight">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-muted-foreground">สร้างบัญชีสำหรับนายหน้าเพื่อเริ่มใช้งาน</p>
        {message && <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{message}</p><a className="mt-2 inline-block font-medium underline" href="#register-form">กลับไปแก้ไข</a></div>}
        <form id="register-form" action={formAction} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">ชื่อผู้ใช้</label>
            <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
            <input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40" />
            <p className="text-xs text-muted-foreground">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">ยืนยันรหัสผ่าน</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <button disabled={pending} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{pending ? "กำลังสมัครสมาชิก…" : "สมัครสมาชิก"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">มีบัญชีแล้ว? <Link href="/login" className="font-medium text-foreground underline underline-offset-4">เข้าสู่ระบบ</Link></p>
      </section>
    </main>
  );
}
