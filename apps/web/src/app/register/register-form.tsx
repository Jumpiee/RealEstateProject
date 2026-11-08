"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@RealEstateProject/ui/components/button";
import { Input } from "@RealEstateProject/ui/components/input";
import { Label } from "@RealEstateProject/ui/components/label";

import { type RegisterState, registerAgent } from "./actions";

const initialState: RegisterState = { error: null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAgent,
    initialState,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const missing = [
    !username.trim() && "ชื่อผู้ใช้",
    !password && "รหัสผ่าน",
    !confirmation && "ยืนยันรหัสผ่าน",
  ].filter(Boolean);
  const message =
    state.error === "required"
      ? "กรุณากรอกข้อมูลให้ครบ"
      : state.error === "short-password"
        ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
        : state.error === "password-mismatch"
          ? "รหัสผ่านไม่ตรงกัน"
          : state.error === "duplicate"
            ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
: state.error === "unavailable" ? "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e44\u0e14\u0e49 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48" : null;
  const correctionField =
    state.error === "required"
      ? !username.trim()
        ? "username"
        : !password
          ? "password"
          : "confirmPassword"
      : state.error === "short-password"
        ? "password"
        : state.error === "password-mismatch"
          ? "confirmPassword"
          : state.error === "duplicate"
            ? "username"
            : "username";
  const fieldHint =
    state.error === "required"
      ? `ช่องที่ต้องแก้ไข: ${missing.join(", ")}`
      : state.error === "short-password"
        ? "ช่องที่ต้องแก้ไข: รหัสผ่าน"
        : state.error === "password-mismatch"
          ? "ช่องที่ต้องแก้ไข: ยืนยันรหัสผ่าน"
          : state.error === "duplicate"
            ? "ช่องที่ต้องแก้ไข: ชื่อผู้ใช้"
        : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-5 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-7 shadow-sm sm:p-9">
        <span className="mb-6 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Building2 className="size-5" /></span>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          ระบบจัดการอสังหาริมทรัพย์สำหรับนายหน้า
        </p>
        <h1 className="font-semibold text-3xl tracking-tight">สมัครสมาชิก</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          สร้างบัญชีสำหรับนายหน้าเพื่อเริ่มใช้งาน
        </p>
        {message && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <p>{message}</p>
            {fieldHint && <p className="mt-1">{fieldHint}</p>}

          </div>
        )}
        <form id="register-form" action={formAction} className="mt-7 space-y-5">
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-md px-3 text-sm"
            />
            <p className="text-muted-foreground text-xs">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              ยืนยันรหัสผ่าน
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-10 rounded-md px-3 text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="h-10 w-full rounded-md text-sm"
          >
            {pending ? "กำลังสมัครสมาชิก…" : "สมัครสมาชิก"}
          </Button>
        </form>
        <p className="mt-6 text-center text-muted-foreground text-sm">
          มีบัญชีแล้ว?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </main>
  );
}
