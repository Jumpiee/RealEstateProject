import { requireAgent } from "@/lib/agent-auth";
import { listProperties } from "@/lib/data-service";
import Properties from "./properties";

export default async function PropertiesPage() {
  const agent = await requireAgent();
  // Q3.1/Q4.1/Q7.3/Q8.1: load the serialized property view for this agent.
  const initialProperties = await listProperties(agent.userId);
  return <Properties initialProperties={initialProperties} />;
}
