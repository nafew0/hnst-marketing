# P6 handoff

Base: `origin/main` `d7f704f`, after P5 and task 0. Branch: `astra/p6-pages-booking`. No shared foundation files or dependencies changed. This is a review handoff; the performance target and live GHL acceptance remain open.

## Delivered

- CMS-backed `/how-it-works`, `/about`, `/proof`, `/the-honest-marketer`, `/book` and booking/magnet thank-you content. Main content components fetch their own data and contain no document shell or window state. Process steps are static; bio/asset placeholders are marked; experience remains hidden.
- Additive Wave 3 draft import, generated schema migration/types, draft SiteSettings and authenticated preview. Anonymous global draft access is denied. Nothing from the new source content was published in the review CMS.
- Booking month/timezone/slots, optional phone, CMS questions, exact separate consent wording, duplicate protection and retry identity. Confirmed responses provide ICS/Google exports; queued responses remain pending without exports. Slot conflicts refresh availability; an uncertain submit retains its key and prevents an unsafe embed retry.
- Availability fallback uses the CMS calendar URL. The actual approved calendar rendered in the production preview at desktop and phone widths, returned HTTP 200 and was not blocked by CSP. No time was selected and no live booking was submitted. Its address was never added to repository files. Actual-calendar screenshots remain private local files.
- CMS package deliverables/comparison and Claude's existing PackageReveal, with an owned container-width layout. Consent-aware booking, pricing, package and CTA analytics.

## Evidence and limits

- `bun run check`: **361 passed, 0 failed**; lint, format, types, contracts, colours, contrast and disable counts passed. Node 24.20 and Bun 1.4.4. Production build passed against PostgreSQL 17. All checks ran locally.
- Whole repository suite, production mocks build, Chromium + WebKit + iPhone emulation: **217 passed, 14 skipped, 12 failed**. This is not a whole-suite pass. Real API lead checks, GPU-dependent checks and CI-only secret sentinels were intentionally inactive where their prerequisites were absent.
- The booking cases passed across all three projects: 201, 202, 409, timezone/month paging, lost-response retry, exact SMS consent and magnet signup. Anonymous global draft protection and consent-aware analytics also passed across all three.
- Whole-suite failures: homepage offer interception conflicts with MSW in all three projects; cookie-preference contrast during its transition in Chromium; intermittent WebKit MSW registration errors in page sweeps; one phone CMS price fallback assertion; one WebKit gallery fixture timeout; and preview authentication over plain HTTP in all three. The preview fixture now supplies explicit editor authentication and normalizes only the local test cookies; production Secure cookies are unchanged. The page sweep now waits for service-worker registration before navigating away. Targeted follow-up after the fixture correction: **3 passed** (Chromium, WebKit, phone). The whole suite was not repeated.
- Axe page sweeps found no serious/critical violations on the thirteen changed routes. The WebKit sweep's failure was a service-worker page error after its axe assertions. Gallery focus, Escape and focus restoration passed targeted WebKit/phone checks; a later whole-suite fixture timeout remains reported above.
- Lighthouse baseline on untouched main: `/` **85**, `/packages` **84**, `/contact` **80**. Final production-fixture scores are in [lighthouse.json](lighthouse.json): accessibility **100 throughout**, performance **80–95**. Only `/about` reaches 95. `/packages` is 85 and `/contact` is 85. These single mobile runs are diagnostics, not a pass against the ≥95 target. No audit was run concurrently with this agent's build/browser suite.
- Browser fixtures are reset from the supplied seed data before visual capture; the gallery test image is a synthetic test asset and is absent from the review CMS and final screenshots.
- [Screenshots](screenshots/) cover all thirteen changed routes at desktop, phone and 900 px widths. These use disposable, published fixtures for visual inspection, not approval/publication of the source content. Real-device and screen-reader checks were not performed.

## Decisions and owner requests

1. **Claude: shared performance follow-up.** Main already missed the target. The baseline identifies the large server-rendered heading as LCP with approximately 3.7 seconds of render delay on contact; the new routes show the same general delay. Review shared layout/font/client startup and PackageReveal cost before declaring ≥95. `/` remains P10's work. The P6 target is explicitly unmet; no shared files were edited to conceal it.
2. **Claude: shared UI follow-up.** The simple Select wrapper's value callback reads `state.value`, which does not display the selected value with the installed Base UI API. P6 uses the supported compound Select API. Server field errors in the shared input wrapper are not reliably visible without its invalid state; P6 additionally renders the contract field errors in an alert. Review the shared wrappers separately.
3. **Founder: content approval.** All Wave 3 copy and operational labels remain draft. Final photos, biographies, proof assets and eBook are absent; the experience figure is hidden. Source §1 questions remain unresolved. Import instructions are in [content-load.md](../../ops/p6/content-load.md).
4. **Nafew: live booking verification.** P5 is merged, but no live GoHighLevel booking was authorized or created. The criterion “a booking appears in GHL” remains open. The mock suite cannot establish it.

No production deployment, DNS change, publication or PR merge was performed.
