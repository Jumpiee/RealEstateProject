"use server";

import { redirect } from "next/navigation";

import { destroyAgentSession } from "@/lib/agent-auth";

export async function signOut() {
  await destroyAgentSession();
  redirect("/login");
}
