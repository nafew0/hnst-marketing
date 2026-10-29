# /api/v1 contract

Source of truth for every request and response between the front end and the back end. **Frozen after Phase 1.** Change it only through a PR that Claude approves (docs/RULES.md), because both sides are built against it in parallel.

| File                                                              | What it holds                                                                                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`                                                       | Shared schemas: idempotency header, tiers, phone (E.164), consent, UTM, ALTCHA, the error codes and envelope, the `queued` response.                                                          |
| `leads.ts`, `booking.ts`, `events.ts`, `offers.ts`, `webhooks.ts` | One file per endpoint group. JSDoc lists every status code.                                                                                                                                   |
| `routes.ts`                                                       | Paths (`apiRoutes`). Import them; never type a URL.                                                                                                                                           |
| `openapi.ts` → `openapi.json`                                     | OpenAPI 3.1 generated from the schemas: `bun run contracts:openapi`. `bun run contracts:check` (in `bun run check`) fails when it is stale.                                                   |
| `client.ts`                                                       | Browser client: `api.submitLead`, `getSlots`, `book`, `sendEvents`, `getOffers`, plus `newIdempotencyKey()` and `toFormState()`. Never throws; validates success bodies against the contract. |
| `mocks/`                                                          | MSW handlers, fixtures, and the `<ApiMocks>` starter mounted in `app/(site)/layout.tsx`.                                                                                                      |

## Rules both sides rely on

- **Idempotency.** Every write carries `Idempotency-Key: <uuid>`. A repeated key replays the first response, with the same status and body. It is never a 409.
- **Errors.** Every non-2xx response is `{ error: { code, message, fields? } }`. `fields` maps a contract path (`email`, `contact.phone`) to a message, so name form inputs after their path.
- **Consent.** `consent.sms: true` requires a phone. The exact wording the visitor saw (`emailText`, `smsText`) travels with the request and is stored as evidence.
- **Times.** Slots are ISO 8601 with an explicit offset in the requested IANA timezone. A slots range is at most 31 days.

## Mocks

Set `NEXT_PUBLIC_API_MOCKS=1` (inlined at build time, so never set it for a production build). The MSW worker (`public/mockServiceWorker.js`, from `bunx msw init public/`) answers `/api/v1/*`, and every other request passes through. Latency is 800 ms in the browser and 0 under `bun test`.

| To see                        | Use                      |
| ----------------------------- | ------------------------ |
| 409 `slot_taken`              | booking email `taken@…`  |
| 202 queued booking (GHL down) | email `…@ghl-down.test`  |
| 429 `rate_limited`            | email `…@ratelimit.test` |
| 400 `captcha_failed`          | ALTCHA payload `fail`    |

`mocks/handlers.test.ts` runs every endpoint through the handlers and parses each answer with the contract, which is also what the real back end must satisfy.
