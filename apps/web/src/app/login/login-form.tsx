"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

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
        : null;
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
    <main className="mx-auto flex min-h-[calc(100svh-1px)] w-full max-w-lg items-center px-5 py-12">
      <section className="w-full rounded-2xl border bg-card p-7 shadow-sm sm:p-9">
        <p className="mb-2 font-medium text-primary text-sm">
          ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า
        </p>
        <h1 className="font-semibold text-3xl tracking-tight">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          เข้าสู่ระบบด้วยบัญชีของนายหน้า
        </p>
        {registered && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 text-sm"
          >
            สมัครสมาชิกสำเร็จ
          </p>
        )}
        {message && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
          >
            <p>{message}</p>
            {fieldHint && <p className="mt-1">{fieldHint}</p>}
            <a
              className="mt-2 inline-block font-medium underline"
              href={`#${correctionField}`}
            >
              กลับไปแก้ไข
            </a>
          </div>
        )}
        <form id="login-form" action={formAction} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="font-medium text-sm">
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="font-medium text-sm">
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
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
