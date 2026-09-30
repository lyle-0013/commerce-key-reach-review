import { z } from "zod";
import { randomUUID } from "node:crypto";
import { assessKeyReach, renderReview, type ReviewRequest } from "./commerce_reach.ts";
import { InfraiClient } from "./infrai_client.ts";

const keysResponseSchema = z.object({
  items: z.array(z.object({ key_id: z.string(), name: z.string() }))
});

const pdfResponseSchema = z.object({}).passthrough();

export async function createAccessReview(
  client: InfraiClient,
  input: ReviewRequest,
  now = new Date()
) {
  const rawKeys = await client.request<unknown>("/v1/account/keys/list", { method: "GET" });
  const parsed = keysResponseSchema.parse(rawKeys);
  const keys = parsed.items.map((key) => ({
    id: key.key_id,
    name: key.name,
    scopes: []
  }));
  const reviewedOn = now.toISOString().slice(0, 10);
  const access = assessKeyReach(keys, input.policy);
  const markdown = renderReview(input.project, reviewedOn, access);
  const pdf = pdfResponseSchema.parse(await client.request<unknown>("/v1/pdf/generate", {
    method: "POST",
    body: JSON.stringify({
      markdown,
      page_size: "A4",
      orientation: "portrait",
      idempotency_key: randomUUID(),
      store: true
    })
  }));

  return { reviewedOn, access, pdf };
}
