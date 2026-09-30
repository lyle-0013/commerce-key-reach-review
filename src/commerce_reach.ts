import { z } from "zod";

export const reviewRequestSchema = z.object({
  project: z.string().min(1),
  policy: z.object({
    checkout: z.array(z.string().min(1)).min(1),
    fulfillment: z.array(z.string().min(1)).min(1),
    receipts: z.array(z.string().min(1)).min(1),
    customer_order_updates: z.array(z.string().min(1)).min(1)
  })
});

export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type CommerceArea = keyof ReviewRequest["policy"];

export type AccountKey = {
  id: string;
  name: string;
  scopes: string[];
};

export type KeyReach = {
  id: string;
  name: string;
  scopes: string[];
  reach: Record<CommerceArea, boolean>;
};

const areas: CommerceArea[] = [
  "checkout",
  "fulfillment",
  "receipts",
  "customer_order_updates"
];

export function assessKeyReach(keys: AccountKey[], policy: ReviewRequest["policy"]): KeyReach[] {
  return keys.map((key) => ({
    ...key,
    reach: Object.fromEntries(areas.map((area) => [
      area,
      policy[area].every((required) => key.scopes.includes(required))
    ])) as Record<CommerceArea, boolean>
  }));
}

export function renderReview(project: string, reviewedOn: string, rows: KeyReach[]): string {
  const header = `# ${project} key access review\n\nReviewed: ${reviewedOn}\n`;
  const body = rows.map((row) => {
    const reach = areas.map((area) => `${area}: ${row.reach[area] ? "yes" : "no"}`).join(" | ");
    return `## ${row.name}\n\nKey ID: ${row.id}\n\nScopes: ${row.scopes.join(", ") || "none"}\n\n${reach}`;
  }).join("\n\n");
  return `${header}\n${body}\n`;
}
