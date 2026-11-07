# Phone QA — M6

## Scope and environment

Reviewed on 7 November 2026 from `astra/mobile`, based on main `6949a21` (M1–M5). This covers Calendar, Mail, Notes and `/wall/remove`. Claude reviews and merges; this is not a launch approval.

- Baseline `bun run check`: 403 tests passed before M6 changes.
- Node 24.20.0 and Bun; production Next build with `NEXT_PUBLIC_PHONE_LAYOUT=1` and `NEXT_PUBLIC_API_MOCKS=1`.
- Fresh local PostgreSQL 16 database `honest_m6_e2e_p3_review`, prepared with Payload migrations, seed, P3/P6 fixtures and `e2e/phone-apps-setup.ts`. The latter creates synthetic published and unpublished notes. No production data.
- Pixel 7 / Chromium and iPhone 13 / WebKit **emulation only**. Desktop Chromium at 800 and 1440 pixels. Reduced motion enabled in the M6 app checks.
- Local server at port 3016. `e2e/phone-apps.config.ts` reads `P6_BASE_URL`; the M3 editor context now reads Playwright's `baseURL`, rather than assuming port 3013.

## Check results

- `bun run check`: passed; 403 tests, zero failures, plus lint, formatting, type checks, plugin tests and generated-asset/contract gates.
- Production build: passed with both phone and MSW flags enabled.
- Four-project browser matrix: 95 passed, 94 expected skips, three initially failed. The two analytics failures came from the test dispatching `pagehide`, which deactivated MSW before the next submission; the test now waits for the normal analytics flush. Both corrected analytics cases and four added notification-content checks passed in a focused six-test run.
- The remaining desktop 404-to-window navigation timeout passed unchanged on rerun (1.5 s). No window assertions or timeouts were weakened. All 98 applicable matrix cases therefore have passing results; the 94 skips are the existing phone/desktop applicability and canvas gates.
- `git diff --check`: passed. The M3 CMS spec baseURL change was typechecked; the full destructive CMS moderation suite was not repeated for M6.

## Acceptance evidence

`e2e/phone-apps.e2e.ts` covers:

| Requirement             | Evidence                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One form across layouts | Desktop inline forms and phone sheets; one form per active page, duplicate-ID audit. Sheets mount on opening.                                                                                                                 |
| Validation and keyboard | Empty compose cannot send; native required-field validation; Tab order, Enter to open, Escape to dismiss and focus restoration.                                                                                               |
| Duplicate submission    | Two same-tick submits produce one lead or booking request.                                                                                                                                                                    |
| Consent                 | Email and SMS start unchecked; exact displayed email consent text reaches the request; SMS remains false.                                                                                                                     |
| Calendar 201            | In-app confirmed receipt, ICS and Google Calendar links; notification includes the booked time.                                                                                                                               |
| Calendar 202            | Pending receipt without calendar links; queued notification has no appointment time.                                                                                                                                          |
| Calendar 409            | “Just taken, pick another time”; availability refreshes and selected time clears.                                                                                                                                             |
| Calendar navigation     | Today marked; days with availability; month paging bounded to 31 days; timezone changes clear the selected time.                                                                                                              |
| Calendar fallback/retry | Offline availability displays the configured calendar embed; a lost response retains the idempotency key after closing/reopening the sheet and editing.                                                                       |
| Package handoff         | `/book?package=founder` sends a top-level `packageInterest: "founder"`. Server retention remains blocked on the shared change below.                                                                                          |
| Drafts                  | Mail and Calendar fields and visitor notes survive home/back; visitor text is absent from local/session storage and cookies. Notes disappear on reload. The implementation has no persistence middleware or IndexedDB writes. |
| Notes publication       | Public note opens in a sheet; unpublished fixture is absent; visitor note sends as the contact message.                                                                                                                       |
| Removal                 | Fragment-only id/token, explicit confirmation, success clears fragment, repeated link fails, rate-limit retry state, query parameters ignored, noindex and absent from sitemap. Synthetic mock wall upload/removal only.      |
| Tracking                | Mail/Notes sent events after analytics consent; visitor message/email omitted from telemetry. Existing `track()` consent gate is reused.                                                                                      |
| Accessibility           | Axe reports no serious/critical violations on checked states; keyboard flows above and existing window keyboard tests. No screen-reader or real-device claim.                                                                 |

`e2e/windows.e2e.ts` is unchanged and is included in the M6 configuration for desktop regressions, including no-JavaScript pages, windows, minimise/restore, focus, reduced motion and axe. Phone projects skip these desktop-window tests by their existing rule.

## Shared changes and remaining verification

- **Claude / booking contract: done at merge (7 Nov).** `bookingInputSchema` now has optional top-level `packageInterest` (the tier schema), with a contract test and the regenerated `openapi.json`. The server accepts and keeps it; mapping it into GHL is still Grok's (next item). Do not describe package-to-GHL delivery as complete.
- **Grok / booking integration:** preserve that field through accepted/queued booking payloads and map it into GHL. Verify the resulting contact/opportunity with a real booking.
- **Claude / shared Select (follow-up):** the default Select popup sits below a window. Calendar supplies a local Positioner stacking level above its window and dock; no shared primitive was edited. Consider applying a shared layering convention for other nested Select consumers.
- **Real GHL untested:** no GHL credentials/calendar configuration were available in this checkout. All booking/lead success evidence is MSW, not proof of GHL delivery. A real Calendar booking with an `@example.com` email is still required.
- **Real devices and assistive technology untested:** emulation and axe/keyboard only; no physical phones or screen-reader test.
- **Live ALTCHA untested in this run:** the production build uses the established MSW captcha fixture. Existing captcha and consent components are reused.
- **Copy awaiting Founder review:** new Mail/Notes compose and Sent text, note privacy/help/empty/error copy, Calendar introduction/package label, removal confirmation/success/error copy, and the existing draft booking-notification and legal consent copy. No new notification triggers or edits to phone settings.

## Changes at merge (Claude, 7 Nov 2026)

- `DraftField` errors no longer carry `role="alert"` (as `InputField`), so the SMS-phone error is announced once; it also gets the field's error and active styles back. This fixed the p6 strict-mode failure.
- "Already received" now applies only to the same message or booking sent again. Before, any later message or booking in the visit, on desktop `/contact` or `/book` too, was answered "received" without being sent. Mail's Sent screen has "Write another"; the Mail spec sends a second message.
- The Mail app is titled Contact, matching its grid label since PR #40; the dock's Mail is a `mailto:` link.
- `phone-apps.e2e.ts` and `phone-cms.e2e.ts` skip under the main Playwright config, like p3 and p6, because they need their own fixtures and server. Their configs turn them on (`M6_TESTS`, `PHONE_CMS_TESTS`).

## Reproduction

Use a disposable database with the suffix required by each fixture script. Run migration and fixture commands with `NODE_ENV=production` to avoid development schema pushes. Build before starting the server; phone flags are inlined at build time.

```sh
NEXT_PUBLIC_PHONE_LAYOUT=1 NEXT_PUBLIC_API_MOCKS=1 bun run build
bunx next start --port 3016
P6_BASE_URL=http://localhost:3016 NEXT_PUBLIC_PHONE_LAYOUT=1 bunx playwright test --config e2e/phone-apps.config.ts --workers 2
bun run check
```

Database/Payload/ALTCHA configuration must be supplied through the existing environment layer. Do not commit environment values or real credentials.
