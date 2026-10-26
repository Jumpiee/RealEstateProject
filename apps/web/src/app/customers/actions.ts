"use server";

import prisma from "@RealEstateProject/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { validateCustomer } from "@/lib/customer-validation";

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export async function createCustomer(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const agent = await requireAgent();
  const input = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    requirements: String(formData.get("requirements") ?? ""),
  };
  const checked = validateCustomer(input);
  const values = { ...input };
  if (!checked.valid)
    return {
      error: "กรุณาแก้ไขข้อมูลลูกค้าตามที่ระบุ",
      fieldErrors: checked.errors,
      values,
    };
  // Q6.2: store phone as a string to preserve leading zeroes.
  await prisma.customer.create({
    data: {
      agentId: agent.id,
      name: input.name.trim(),
      phone: input.phone,
      requirements: input.requirements.trim(),
    },
  });
  revalidatePath("/customers");
  redirect("/customers?saved=1");
}
