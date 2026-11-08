"use server";

import { runUseCaseQuery } from "@RealEstateProject/db";
import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/agent-auth";

export type RegisterState =
  | { error: "required" | "short-password" | "password-mismatch" | "duplicate" | "unavailable" }
  | { error: null };

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; meta?: { code?: unknown } };
  return value.code === "P2002" || value.code === "23505" || value.meta?.code === "23505";
}

export async function registerAgent(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!username || !password || !confirmation) return { error: "required" };
  if (username.length < 3 || username.length > 50 || !/^[a-z0-9_]+$/.test(username)) return { error: "required" };
  if (password.length < 8) return { error: "short-password" };
  if (password !== confirmation) return { error: "password-mismatch" };

  try {
    const existing = await runUseCaseQuery<{user_id: bigint}>("Q1.1", [username]);
    if (existing.length) return { error: "duplicate" };
    const inserted = await runUseCaseQuery<{user_id: bigint}>("Q1.2", [username, await hashPassword(password)]);
    if (!inserted.length) throw new Error("Registration insert returned no user_id");
  } catch (error) {
    return { error: isUniqueViolation(error) ? "duplicate" : "unavailable" };
  }
  redirect("/login?registered=1");
}
