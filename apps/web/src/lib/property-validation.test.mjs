import assert from "node:assert/strict";
import test from "node:test";
import { hasNumericValue } from "./property-validation.ts";

test("accepts numeric zero as a present price", () => {
  assert.equal(hasNumericValue("0"), true);
  assert.equal(hasNumericValue(0), true);
});

test("rejects missing and whitespace-only area or price", () => {
  assert.equal(hasNumericValue(""), false);
  assert.equal(hasNumericValue("   "), false);
  assert.equal(hasNumericValue(undefined), false);
});
