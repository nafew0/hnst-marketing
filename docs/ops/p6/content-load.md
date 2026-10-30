# P6 CMS content load

Use Node 24.20+ and Bun 1.4.4, with the normal validated server environment and PostgreSQL 17. No new dependencies are required.

1. Back up the target database, then run `bunx payload migrate`. The P6 migration adds the new blocks and draft versions for SiteSettings. It retains the published status of existing settings.
2. Run `NODE_ENV=production bun lib/cms/seed-wave3.ts /absolute/private/path/HONEST-Website-Wave3-Inputs.md` in an authorized CMS environment. Omit the path when preparing a disposable environment without the real calendar configuration.
3. The importer creates seven missing page records and ten FAQ drafts. It preserves existing editor content, except the original seed's exact unanswered FAQ placeholder. It adds draft qualifying questions and disclosures only when questions are empty.
4. When the private file is provided, its approved booking embed address is stored in SiteSettings only. The importer validates the approved origin and never prints the address. Keep the private file, database exports and actual-calendar screenshots out of Git.
5. Review `/cms-preview?path=/about` and the other normal routes while authenticated as an editor/admin. `[DRAFT]` appears in preview only. Public reads never select the draft versions; anonymous SiteSettings draft requests return 403.
6. Obtain the Founder's content decisions before publishing marketing content. Photos, bios, proof screenshots and the eBook remain labelled placeholders. The experience figure stays hidden. Consent wording still requires its existing separate approval.

The isolated local review database was loaded with all new P6 content as drafts and the approved calendar configuration. No production deployment or content publication is implied. These records must be imported into the eventual staging/production CMS using its authorized configuration.

## Disposable browser fixtures

`e2e/p6-setup.ts` deliberately publishes synthetic review records only in a loopback database whose name ends `_e2e_p3_review`. It sets a fake calendar address intercepted by the test. Never run that fixture command against the review or production CMS.

Build with `NEXT_PUBLIC_API_MOCKS=1` for booking tests. CI uses this mode and holds no GHL credentials or worker. A confirmed 201, queued 202 and slot conflict are separate cases. A queued result offers no calendar exports. An uncertain request retains the same logical idempotency key on retry and never offers an embed that could create a second booking.

The production embed was inspected inside `/book` at desktop and phone widths without choosing a time or submitting. A real appointment appearing in GHL remains unverified until Nafew authorizes a live booking.

The calendar address saves to the pending SiteSettings draft whenever one exists, and goes live when that draft is published. Re-running the seed never publishes anything else with it.

Go-live: the Docker build has no `DATABASE_URL`, so these ISR routes can serve their "in preparation" fallback for up to an hour after a deploy. Revalidate them as a deploy step.
