"use server";

import { redirect } from "next/navigation";

import prisma from "@RealEstateProject/db";
import { hashPassword } from "@/lib/agent-auth";

export type RegisterState = { error: "required" | "short-password" | "password-mismatch" | "duplicate" } | { error: null };

export async function registerAgent(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!username || !password || !confirmation) return { error: "required" };
  if (password.length < 8) return { error: "short-password" };
  if (password !== confirmation) return { error: "password-mismatch" };

  const existing = await prisma.agent.findUnique({ where: { username }, select: { id: true } });
  if (existing) return { error: "duplicate" };

  try {
    await prisma.agent.create({ data: { username, passwordHash: await hashPassword(password) } });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "duplicate" };
    }
    throw error;
  }
  redirect("/login?registered=1");
}
