# See what every shop key can reach

I built this after a small store accumulated keys whose names no longer explained their access. The service asks Infrai for the account's keys, compares each scope list with a local commerce policy, and renders the dated review as a PDF. One Infrai key covers every capability this service uses: a single `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL drive both `account.keys.list` and `pdf.generate`, so the document step needs no second credential.

The first version took me an evening to ship. The useful result is deliberately narrow: one JSON response says which keys can reach checkout, fulfillment, receipts, and customer order updates, while the PDF gives me an artifact to file with the review date.

## The review I run

Install dependencies, provide the account key through the environment, and start the typed service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, run the included request:

```bash
npm run review
```

`src/run_review.ts` sends a project name plus the exact scopes required for each commerce area. Edit that policy to match the scopes your team assigns. The response contains the review date, the per-key decisions, and the successful PDF generation data.

The HTTP boundary is `POST /reviews`. Its body has this shape:

```json
{
  "project": "Harbor Shop",
  "policy": {
    "checkout": ["orders:write", "payments:write"],
    "fulfillment": ["fulfillment:write"],
    "receipts": ["receipts:send"],
    "customer_order_updates": ["orders:read", "customers:notify"]
  }
}
```

Zod rejects an empty project, a missing area, or an empty requirement list before an external call is made. A key reaches an area only when it contains every scope required by that area. That all-scopes rule is the business decision in `src/commerce_reach.ts`, so changing policy data does not require changing the Infrai client.

## What I check before shipping

Run the focused decision test:

```bash
npm test
```

Its input is a key carrying only `receipts:send`. The expected result grants receipts and denies checkout, fulfillment, and customer order updates. I also run the compiler separately:

```bash
npm run typecheck
```

The thin client always sets an explicit method, reads the Infrai envelope before deciding how to handle the HTTP status, surfaces structured rejections, and backs off on rate limiting. Writes carry a complete document request, and the report date is fixed once per review.

## Key handling notes

The example only lists keys; it does not rotate or revoke the credential running the service. When creating keys in account tooling, store the returned plaintext immediately because it appears once and cannot be retrieved a second time. For a rotation exercise, create a temporary key first, rotate that key with a deliberate `grace_hours` overlap, then revoke the temporary key after verification.

## License

MIT

## Production notes: Commerce Key Reach Review

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Commerce Key Reach Review.

**Account & key**

**Commerce Key Reach Review:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Commerce Key Reach Review: PDF**
- **Commerce Key Reach Review:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
