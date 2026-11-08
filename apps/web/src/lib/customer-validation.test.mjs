import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomer } from "./customer-validation.ts";

test("accepts a customer with a nonblank name and ten digit phone", () => {
  assert.equal(
    validateCustomer({ name: "สมชาย", phone: "0812345678" }).valid,
    true,
  );
});

test("rejects a blank customer name", () => {
  assert.equal(
    validateCustomer({ name: "  ", phone: "0812345678" }).errors.name,
    "กรุณากรอกชื่อลูกค้า",
  );
});

test("rejects phone values that are not exactly ten digits", () => {
  for (const phone of ["812345678", "08123456789", "08123a5678"]) {
    assert.equal(
      validateCustomer({ name: "สมชาย", phone }).errors.phone,
      "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก",
    );
  }
});

test("accepts blank optional budget and income values", () => {
  assert.equal(
    validateCustomer({
      name: "สมชาย",
      phone: "0812345678",
      budget: "",
      income: "   ",
    }).valid,
    true,
  );
});

test("accepts nonnegative currency amounts within Decimal(18, 2)", () => {
  for (const amount of ["0", "125000", "125000.5", "9999999999999999.99"]) {
    assert.equal(
      validateCustomer({ name: "สมชาย", phone: "0812345678", budget: amount })
        .valid,
      true,
      amount,
    );
  }
});

test("rejects malformed, negative, over-precision, and out-of-range amounts", () => {
  for (const amount of [
    "-1",
    "+1",
    "1e3",
    "Infinity",
    "1.234",
    "10000000000000000",
    "9999999999999999.991",
  ]) {
    assert.equal(
      validateCustomer({ name: "สมชาย", phone: "0812345678", budget: amount })
        .errors.budget,
      "กรุณากรอกงบประมาณเป็นตัวเลขไม่ติดลบ มีทศนิยมไม่เกิน 2 ตำแหน่ง และไม่เกิน 9999999999999999.99",
      amount,
    );
  }
});

test("reports amount errors against the matching income field", () => {
  assert.equal(
    validateCustomer({ name: "สมชาย", phone: "0812345678", income: "2.001" })
      .errors.income,
    "กรุณากรอกรายได้เป็นตัวเลขไม่ติดลบ มีทศนิยมไม่เกิน 2 ตำแหน่ง และไม่เกิน 9999999999999999.99",
  );
});
