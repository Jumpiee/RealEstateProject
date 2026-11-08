"use server";

import { runUseCaseQuery } from "@RealEstateProject/db";
import { redirect } from "next/navigation";
import { createAgentSession, verifyPassword } from "@/lib/agent-auth";

export type LoginState = { error: "required" | "invalid" | "unavailable" } | { error: null };

export async function loginAgent(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "required" };

  let user: {user_id:bigint;username:string;password_hash:string}|undefined;
  try {
    [user] = await runUseCaseQuery<{user_id: bigint; username: string; password_hash: string}>("Q2.1", [username]);
    if (!user || !(await verifyPassword(password, user.password_hash))) return { error: "invalid" };
    await createAgentSession(String(user.user_id), user.username);
  } catch {
    return { error: "unavailable" };
  }
  redirect("/dashboard");
}
