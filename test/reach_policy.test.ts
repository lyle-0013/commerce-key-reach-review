import test from "node:test";
import assert from "node:assert/strict";
import { assessKeyReach } from "../src/commerce_reach.ts";

test("a receipt-only key cannot checkout or update an order", () => {
  const [result] = assessKeyReach([
    { id: "key_receipts", name: "receipt sender", scopes: ["receipts:send"] }
  ], {
    checkout: ["orders:write", "payments:write"],
    fulfillment: ["fulfillment:write"],
    receipts: ["receipts:send"],
    customer_order_updates: ["orders:read", "customers:notify"]
  });

  assert.deepEqual(result.reach, {
    checkout: false,
    fulfillment: false,
    receipts: true,
    customer_order_updates: false
  });
});
