# P6 task 0: reusable page content — 30 October 2026

Base: `origin/main` at `8e32ef5`. Branch: `astra/p6-page-split`.

## Handoff to P7W

The route files retain their metadata and `PageShell`. Import these async Server Components for the window content:

| Route              | Component              | Module                                                  | Input          |
| ------------------ | ---------------------- | ------------------------------------------------------- | -------------- |
| `/packages`        | `PackagesContent`      | `components/sections/standard/pages/packages.tsx`       | None           |
| `/packages/[tier]` | `PackageDetailContent` | `components/sections/standard/pages/package-detail.tsx` | `tier: string` |
| `/contact`         | `ContactContent`       | `components/sections/standard/pages/contact.tsx`        | None           |

Each component fetches its own CMS data. The package detail component retains the missing-package `notFound()` check, form, FAQ and service JSON-LD. Metadata, normal links, copy, classes and section order were preserved. A comparison against the original route JSX passed after removing only the shell and whitespace.

The extracted content contains no page shell, viewport-height sections, document scrolling hooks or window state. This task adds no dependencies or CMS content. Existing draft content was published only in an isolated disposable test database by the repository's P3 fixture script; no real CMS or GHL account was used.

## Reproduction environment

Node 24.20.0 (`nvm use`), Bun 1.4.4, Postgres.app 16.9 on an isolated local port (the installed runtime; Postgres 17 compatibility was not exercised), Chromium and WebKit installed by Playwright. Test data uses a fresh database ending in `_p3_review`, with disposable Payload and ALTCHA secrets. No GHL credentials or worker are present.

Prepare with the repository's existing commands: `bunx payload migrate`, `bun scripts/migrate.ts`, `NODE_ENV=production bun run seed`, then `NODE_ENV=production bun e2e/p3-setup.ts`. Set the public base URL to `http://localhost:3003`.

## Baseline before extraction

- `bun run check`: **335 passed, zero failed**. An earlier restricted run could not bind the fetch tests' local HTTP server; the run with local server access passed.
- `bun run build`: passed with the disposable CMS configured.
- All six affected URLs returned 200 at desktop (1440 × 1000), phone (iPhone 13 WebKit, 390 × 664 CSS viewport) and 900 × 900. No document overflow or page errors were observed.
- Lighthouse CI 0.15.1, repository `e2e/p3-lighthouse.cjs`, one mobile run per route, Playwright Chromium 1248, no simultaneous builds or test suites:

| Route       | Performance | Accessibility |   LCP |     TBT | CLS |
| ----------- | ----------: | ------------: | ----: | ------: | --: |
| `/`         |          47 |           100 | 6.1 s | 1760 ms |   0 |
| `/packages` |          70 |           100 | 4.3 s |  600 ms |   0 |
| `/contact`  |          72 |           100 | 4.3 s |  550 ms |   0 |

These are local measurements, distinct from the previously reported GitHub runner scores (77 / 88 / 92). They do not meet the performance targets; this extraction does not claim to solve the inherited performance work. Background activity outside this checkout was not controlled.

## Results after extraction

- Extracted production build: passed. Direct visits to all six URLs also returned 200 with one server-rendered h1 with JavaScript disabled. An unknown package tier retained a real 404. Both optional consent checkboxes toggled with Space and showed a visible keyboard-focus outline.
- Extracted `bun run check`: **335 passed, zero failed**.
- All 18 captures (six URLs × desktop, phone, 900 px) are **pixel-identical** to baseline. Titles, canonicals, h1s and full main-content text match. Each returned 200, with no document overflow, page errors or console errors, and zero serious/critical axe violations.
- The complete repository production suite ran in Chromium: **52 passed, 10 skipped, 1 failed**. The failure was the CMS editor dashboard login assertion; its price update, permission and anonymous-access assertions passed. The same editor test subsequently passed alone in Chromium (**1 passed**), and passed in both WebKit projects. The initial full run is not reported as green.
- The complete suite also ran serially in desktop WebKit and iPhone 13 emulation, via a temporary config extending `e2e/p3-production.config.ts`, preserving every spec and using one worker: **103 passed, 19 skipped, 4 failed**. Failures were the homepage hero-opacity assertion in both projects (`Number(keyframe.opacity)` produced `NaN`), an intermittent `/lab` axe `label` violation in desktop WebKit, and the homepage manifesto test in phone emulation (`mouse.wheel` is unsupported in mobile WebKit).
- Production API tests exercised real local ALTCHA and the site's leads handler, and verified one queued outbox row for double-click and uncertain retries. No worker or GHL delivery was exercised.
- Skips were the seven mock-server-only P3 specs per project, the absent CI sentinel-secret scan, the inherited light-theme fixture skip, and the software/missing-GPU test where applicable. No tests or gates were weakened.
- Real devices, screen readers and Postgres 17 were not tested. Package/content approval, booking and the rest of P6 are outside task 0.

## Main-branch control and follow-up ownership

Restored the original three route files from `8e32ef5`, rebuilt with the same environment and ran the affected WebKit checks. Result: **3 passed, 3 failed**. The two hero-opacity `NaN` assertions and the phone manifesto test's unsupported `mouse.wheel` operation reproduced on unchanged main. `/lab` passed both isolated control runs, so the initial label finding remains intermittent rather than a proven persistent regression. The extracted route files were then restored and the final version rebuilt.

| Owner                                                 | Route / check                           | Reproduction                                                                                                    | Expected follow-up                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Astra QA, with Claude for any rendering change        | `/`, `foundation.e2e.ts` hero assertion | WebKit and phone project, test `hero text never starts fully transparent`                                       | Interpret browser-serialized keyframe values correctly while still proving initial text is visible; do not weaken the opacity requirement. |
| Claude / P10                                          | `/`, `progress-text.e2e.ts`             | Phone project, scroll-manifesto test                                                                            | The final word should be fully revealed when scrolling to the bottom.                                                                      |
| Claude for shared lab control; Astra for reproduction | `/lab`, `foundation.e2e.ts`             | Full desktop WebKit suite reported axe `label`; isolated control passed                                         | Identify the unlabelled control or readiness race before claiming this whole-suite run green.                                              |
| Astra                                                 | `/admin/login`, `p3-cms.e2e.ts`         | Initial Chromium full-suite login dashboard assertion timed out; isolated rerun and both WebKit projects passed | Track the intermittent login assertion; the full initial run remains failed.                                                               |

These findings do not change task 0's extracted markup, styles or data reads. No shared files were changed. No self-merge is authorized. P7W can consume the exported components after the Founder accepts and merges the small PR.

## Final Lighthouse comparison

Same settings and browser, one mobile run per URL, with screenshot processing and test suites stopped:

| Route       | Baseline performance | Extracted performance | Extracted accessibility |
| ----------- | -------------------: | --------------------: | ----------------------: |
| `/`         |                   47 |                    65 |                     100 |
| `/packages` |                   70 |                    82 |                     100 |
| `/contact`  |                   72 |                    78 |                     100 |

Single-run scores vary; these results do not demonstrate an optimization. The inherited performance targets remain unmet. `/` remains P10's responsibility; package and contact performance work must be handled separately from this no-visual-change extraction.

## Screenshots

Full-page production captures; desktop uses Chromium at 1440 × 1000 and phone uses WebKit iPhone 13 emulation. Screenshot images are lossless WebP exports. All six pages were visually reviewed.

| Route                 | Desktop                                                  | Phone                                                |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| `/packages`           | [Desktop](p6-page-split/packages-desktop.webp)           | [Phone](p6-page-split/packages-phone.webp)           |
| `/packages/basic-diy` | [Desktop](p6-page-split/packages-basic-diy-desktop.webp) | [Phone](p6-page-split/packages-basic-diy-phone.webp) |
| `/packages/executive` | [Desktop](p6-page-split/packages-executive-desktop.webp) | [Phone](p6-page-split/packages-executive-phone.webp) |
| `/packages/founder`   | [Desktop](p6-page-split/packages-founder-desktop.webp)   | [Phone](p6-page-split/packages-founder-phone.webp)   |
| `/packages/diamond`   | [Desktop](p6-page-split/packages-diamond-desktop.webp)   | [Phone](p6-page-split/packages-diamond-phone.webp)   |
| `/contact`            | [Desktop](p6-page-split/contact-desktop.webp)            | [Phone](p6-page-split/contact-phone.webp)            |
