export type CustomerInput = {
  name: string;
  phone: string;
  requirements?: string;
};

export function validateCustomer(input: CustomerInput) {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "กรุณากรอกชื่อลูกค้า";
  if (!/^\d{10}$/.test(input.phone))
    errors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
  return { valid: Object.keys(errors).length === 0, errors };
}
