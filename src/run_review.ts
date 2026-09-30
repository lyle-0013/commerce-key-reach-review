export {};

const response = await fetch("http://localhost:3000/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    project: "Harbor Shop",
    policy: {
      checkout: ["orders:write", "payments:write"],
      fulfillment: ["fulfillment:write"],
      receipts: ["receipts:send"],
      customer_order_updates: ["orders:read", "customers:notify"]
    }
  })
});

console.log(JSON.stringify(await response.json(), null, 2));
