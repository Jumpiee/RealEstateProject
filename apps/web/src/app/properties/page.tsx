import prisma from "@RealEstateProject/db";
import { requireAgent } from "@/lib/agent-auth";
import Properties from "./properties";

export default async function PropertiesPage() {
  const agent = await requireAgent();
  // Q3.1/Q4.1/Q7.1/Q8.1: initial property list with current statuses, scoped to the signed-in agent.
  const properties = await prisma.property.findMany({
    where: { agentId: agent.id },
    include: { owner: true, postings: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <Properties initialProperties={JSON.parse(JSON.stringify(properties))} />
  );
}
