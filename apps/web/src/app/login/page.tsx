import { redirect } from "next/navigation";

import { getAgent } from "@/lib/agent-auth";
import LoginForm from "./login-form";

type SearchParams = Promise<{ registered?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await getAgent()) redirect("/dashboard");
  const query = await searchParams;
  return <LoginForm registered={query.registered === "1"} />;
}
