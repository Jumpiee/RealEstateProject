"use server";

import prisma from "@RealEstateProject/db";
import { redirect } from "next/navigation";
import { createAgentSession, verifyPassword } from "@/lib/agent-auth";

export type LoginState = { error: "required" | "invalid" } | { error: null };

export async function loginAgent(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "required" };

  const agent = await prisma.agent.findUnique({ where: { username } });
  if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
    return { error: "invalid" };
  }
  await createAgentSession(agent.id);
  redirect("/dashboard");
}
