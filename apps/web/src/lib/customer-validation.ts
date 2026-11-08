export type CustomerInput = { name:string; phone:string; requirements?:string; budget?:string; income?:string };
function isValidAmount(value:string|undefined,digits:number){
 const amount=value?.trim()??"";if(amount==="")return true;
 if(!/^\d+(?:\.\d{1,2})?$/.test(amount))return false;
 const integer=amount.split(".")[0].replace(/^0+/,"")||"0";return integer.length<=digits;
}
export function validateCustomer(input:CustomerInput){
 const errors:Record<string,string>={};
 if(!input.name.trim())errors.name="กรุณากรอกชื่อลูกค้า";
 if(!/^\d{10}$/.test(input.phone))errors.phone="เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
 if(!isValidAmount(input.budget,12))errors.budget="กรุณากรอกงบประมาณเป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง";
 if(!isValidAmount(input.income,10))errors.income="กรุณากรอกรายได้เป็นตัวเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง";
 return {valid:Object.keys(errors).length===0,errors};
}
