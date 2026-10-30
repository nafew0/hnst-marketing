# HONEST CMS (P3)

Payload owns the default Postgres schema. P2 owns the separate integration schema. The admin lives at `/admin`, its REST API at `/api/cms`, and authenticated draft preview at `/cms-preview?path=/packages`. Public queries never return drafts.

## Local development

Use Node from `.nvmrc`, Bun 1.4.4, and a local Postgres 17 database. Supply `DATABASE_URL`, `PAYLOAD_SECRET` (at least 32 characters), `ALTCHA_HMAC_KEY` (at least 32 characters), and `NEXT_PUBLIC_BASE_URL` in your private environment. Never commit environment files. Set `NEXT_PUBLIC_API_MOCKS=1` only for development against MSW.

1. `bun install --frozen-lockfile`
2. `bun run seed`
3. `bunx next dev --port 3003`
4. Open `/admin` to create the first administrator. Subsequent user creation requires an administrator. Editors can edit content, but cannot create users or grant themselves administrator privileges.

The seed is additive: four unpublished package drafts, three core pages, seven unpublished legal placeholders, ten unpublished FAQ placeholders, and initial settings. Existing editorial records are preserved. Package facts come from the 29 October 2026 draft Master Tier Table and remain drafts until Nafew confirms the figures. The disposable review fixture explicitly publishes them only for testing. Legal text, missing facts, and consent approval require editorial review. Live forms stay disabled until `consentTexts.approved` is enabled. A mock-mode notice accompanies simulated submissions.

## Schema and deployment

Run `bun run cms:types` and `bun run cms:importmap` after changing collections or editor features, then format the generated files. Generation is explicit to prevent development requests from rewriting reviewed artifacts. After a schema change, generate a migration with `bunx payload migrate:create <name>` and review its SQL. Remove unused generated arguments and use type imports; do not add lint suppressions.

The initial migration is included in `lib/cms/migrations`. On a fresh production database, run `bunx payload migrate` before `bun run seed`. Do not run the initial migration over a development database already created by Payload's schema push. Use a fresh database or Payload's documented migration-baselining workflow. Uploads default to `./media` in every mode. Set `MEDIA_DIR=/srv/media/uploads` on the VM; a local production server may use any writable local directory. Configure a production email adapter before relying on password-reset email.

P3 moves the HTML root into the site and Payload route groups so Payload can own its admin layout. The homepage and lab routes stay static and never read the CMS in their layout. Payload afterChange/afterDelete hooks invalidate CMS pages and the tagged SiteSettings cache. Published prices and consent changes appear without rebuilding. The tracking ID is fetched through a server action only after analytics consent; an unavailable database disables the tracker without breaking the homepage. No new dependencies were added.

## Forms and tracking

All lead requests use the frozen contract client. ContactForm, PackageInterestForm, and MagnetForm share validation, optional phone, separate unchecked consent, first-touch attribution, and retry-safe idempotency. The exact displayed consent text is sent with the request. ALTCHA uses the installed v2 library's SHA-256 challenge format; P2's verifier must accept that same format. Production requires a signing key and the real P2 endpoint.

Analytics events and GHL External Tracking are gated by analytics consent. Set the public tracking ID in SiteSettings, never an API token. Withdrawal auto-clears known HighLevel/analytics cookies and matching local/session storage, clears the local event queue and reloads the page if the external tracker was loaded. The GHL tracker stays disabled in mock mode.

## Focused verification

`bun run check` is the mandatory quality gate. `bun run build` builds with mocks off. For a disposable localhost database named with the `_p3_review` suffix only, run `bun e2e/p3-setup.ts`, then `bunx playwright test --config e2e/p3.config.ts --project chromium --grep 'contact submits|editor updates'`. Fixture credentials are deliberately local test data and must never be installed in production.

CI also defines Chromium/WebKit, axe page checks, and Lighthouse budgets. See `docs/qa/p3.md` for the checks actually performed and remaining integration limits.
