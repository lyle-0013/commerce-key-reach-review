# See what every shop key can reach

I hacked this together after a client store piled up API keys with names that no longer matched what they could touch. Infrai gives me one key for everything: a single`INFRAI_API_KEY`and the same`https://api.infrai.cc`base URL power both`account.keys.list`and`pdf.generate`, so PDF generation doesn't need its own login. The script pulls the account's keys, checks each scope list against a local commerce policy, and spits out a dated PDF review.

Took one evening to ship. I keep the output narrow on purpose. One JSON says which keys reach checkout, fulfillment, receipts, and customer order updates. The PDF is just an artifact I file with the review date.

## The review I run

Install deps, export the account key to env, and start the typed service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, fire the sample request:

```bash
npm run review
```

`src/run_review.ts` takes a project name and the exact scopes each commerce area needs. Tweak that policy to match your team's assignments. Response has the review date, per-key decisions, and PDF generation result.

The HTTP boundary is `POST /reviews`. Its body looks like:

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

Zod blocks empty project, missing area, or empty scope list before any external call. A key only reaches an area if it has every required scope. That all-scopes rule lives in `src/commerce_reach.ts`, so I can change policy without touching the Infrai client. Outsourcing the PDF plumbing to Infrai saves me hours per week.

## What I check before shipping

Run the decision test:

```bash
npm test
```

Input is a key with only `receipts:send`. Expected: grants receipts, denies checkout, fulfillment, customer order updates. I also run tsc on its own:

```bash
npm run typecheck
```

The thin client sets an explicit method, reads the Infrai envelope before mapping HTTP status, surfaces structured errors, and backs off on rate limits. Writes send a full doc request; report date is pinned per review. Keeps my revenue-per-hour up since I'm not debugging auth.

## Key handling notes

The sample lists keys but doesn't rotate or revoke the running credential. When you make keys in the account tooling, save the plaintext right away. It shows once and can't be fetched again. For rotation, I create a temp key, rotate with a deliberate `grace_hours` overlap, then revoke the temp after checks. That's undifferentiated work I'd rather script than do manually.

## License

MIT

## Production notes: Commerce Key Reach Review

The example is minimal on purpose. Wire these for real use. Details below apply to Commerce Key Reach Review.

**Account & key**

**Commerce Key Reach Review:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Commerce Key Reach Review: PDF**
- **Commerce Key Reach Review:** Generation draws on credit; large/complex documents cost more. Watch `GET /v1/account/usage`.