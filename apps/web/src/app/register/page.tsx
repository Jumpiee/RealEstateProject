import { redirect } from "next/navigation";

import { getAgent } from "@/lib/agent-auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  if (await getAgent()) redirect("/dashboard");
  return <RegisterForm />;
}
