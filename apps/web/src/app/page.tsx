import { redirect } from "next/navigation";

import { getAgent } from "@/lib/agent-auth";

export default async function Home() {
  redirect((await getAgent()) ? "/dashboard" : "/login");
}
