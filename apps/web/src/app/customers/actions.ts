"use server";
import { runUseCaseQuery } from "@RealEstateProject/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/agent-auth";
import { validateCustomer } from "@/lib/customer-validation";

export type CustomerFormState = { error?:string; fieldErrors?:Record<string,string>; values?:Record<string,string> };
export async function createCustomer(_state:CustomerFormState,formData:FormData):Promise<CustomerFormState>{
 const agent=await requireAgent();
 const input={name:String(formData.get("name")??""),phone:String(formData.get("phone")??""),requirements:String(formData.get("requirements")??""),budget:String(formData.get("budget")??""),income:String(formData.get("income")??"")};
 const checked=validateCustomer(input);if(!checked.valid)return {error:"กรุณาแก้ไขข้อมูลลูกค้าตามที่ระบุ",fieldErrors:checked.errors,values:input};
 const result=await runUseCaseQuery<{buyer_id:bigint}>("Q6.2",[BigInt(agent.userId),input.name.trim(),input.phone,input.requirements.trim()||null,input.budget.trim()?input.budget.trim():null,input.income.trim()?input.income.trim():null]);
 if(result.length!==1)throw new Error("Q6.2 did not return buyer_id");
 revalidatePath("/customers");redirect("/customers?saved=1");
}
