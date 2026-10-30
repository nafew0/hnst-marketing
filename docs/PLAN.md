# HONEST Marketing Website: Phase-by-Phase Development Plan (hnst.marketing)

_v2, 29 Oct 2026. Scope: **HONEST's own website only**._

**Every decision in this plan is final.** Each phase is a brief for one coder (Claude, GPT-6.1 Astra or Grok 4.7) to _execute_, not to redesign. To start a phase, paste the Common Rules (§3) and then that phase's section as the first message in the coder's session. Nafew provides the inputs listed under "Nafew provides before start".

---

## Satus adaptations (P1, 30 Oct 2026). These override the rest of this plan

P1 forked Satus v3 and kept its conventions instead of re-creating the plan's original layout. Where this section and the older text below disagree, **this section wins**. The phase briefs in `docs/phases/` already have their paths rewritten.

### A. Where things live (no `src/`, no `packages/`)

| Plan said                                                                                        | As built                                                                                               | Owner              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------ |
| `brand.config.ts`                                                                                | `brand.config.ts` (OKLCH values, hex in comments)                                                      | Claude             |
| `scripts/build-tokens.ts`, `src/styles/tokens.css`                                               | `bun run tokens` (= Satus `setup:styles`) → `lib/styles/css/*.css` (generated, never hand-edit)        | Claude             |
| `packages/contracts/` (`openapi.yaml`)                                                           | `lib/contracts/` (`openapi.json`, `client.ts`, `mocks/`)                                               | Claude, frozen     |
| `src/components/ui/`, `motion/`, `three/`                                                        | `components/ui/`, `components/motion/`, `components/three/`                                            | Claude             |
| `src/components/layout` (Nav, Footer)                                                            | `components/layout/header`, `components/layout/footer`; links in `lib/navigation.ts`                   | Claude             |
| `src/sections/signature/`                                                                        | `components/sections/signature/`                                                                       | Claude             |
| `src/app/(site)/page.tsx`, `/lab`                                                                | `app/(site)/page.tsx`, `app/(site)/lab/`                                                               | Claude             |
| `src/app/(site)/**` (other routes)                                                               | `app/(site)/**`                                                                                        | Astra              |
| `src/app/(payload)/**`, `payload.config.ts`, `src/collections/**`                                | `app/(payload)/**`, `payload.config.ts`, `lib/cms/**`                                                  | Astra              |
| `src/sections/standard/`, `src/components/forms/`, `src/lib/track.ts`                            | `components/sections/standard/`, `components/forms/`, `lib/track.ts`                                   | Astra              |
| `packages/ghl/`                                                                                  | `lib/ghl/` (server only: call `assertServerEnvironment()` as `lib/env.ts` does)                        | Grok               |
| `src/lib/ghl-read/`                                                                              | `lib/ghl-read/`                                                                                        | Grok               |
| `src/app/api/**`                                                                                 | `app/api/v1/**`, `app/api/webhooks/**`, `app/api/health/**` (Satus's existing `app/api/*` routes stay) | Grok               |
| `worker/`, `db/migrations/`, `scripts/media/`, `scripts/ghl-setup.ts`, `deploy/`, `Dockerfile.*` | unchanged, repo root                                                                                   | Grok               |
| `tests/unit/backend/`, `tests/unit/frontend/`                                                    | colocated `*.test.ts` next to the code, run by `bun test`                                              | owner of that code |
| `tests/e2e/`                                                                                     | `e2e/*.e2e.ts` (Playwright)                                                                            | Astra              |

### B. Tooling

- **Engineering rules: `AGENTS.md` is binding.** It covers oxlint and oxfmt (no ESLint or Prettier), React Compiler (no `useMemo`, `useCallback` or `memo`), `@/components/ui/link` and `@/components/ui/image` (never raw `<a>` or `<img>`), hamo instead of raw layout reads and observers, and OKLCH colours. It also bans lint-disable comments.
- **Quality gate: `bun run check`.** It runs lint, format, types, `bun test`, colours, contracts, contrast and the lint-disable count, and must pass before every PR.
- **Lighthouse CI and autocannon are not dependencies.** Their transitive packages fail `bun audit`, so run them on demand: `bunx @lhci/cli@0.15.1 autorun` (P9) and `bunx autocannon@8` (P8).
- **Tests: `bun test` replaces Vitest.** Satus's rule applies: list failure modes first, prefer E2E for complex behaviour, and keep unit tests for isolated systems and cross-module invariants.
- **Runtime versions:**
  - Node ≥ 24.20 (`.nvmrc`) and Bun 1.4.4.
  - `bunfig.toml` refuses packages published less than 3 days ago, so pin the previous version if an install fails.
- **Styling:**
  - The breakpoint variant is `dt:` (≥ 800 px). There are no `sm:`, `md:` or `lg:` variants.
  - Viewport-scaled sizes use `dr-*` utilities (`dr-py-120`, `dr-gap-24`).
  - Show and hide by breakpoint with the `desktop-only` and `mobile-only` utilities.

### C. Colours, fonts, themes

- **All colours live in `brand.config.ts`**, as OKLCH with the original hex in a comment. To change one, edit it there and run `bun run tokens`.
  - `bun run check:colors` fails on a hex value anywhere else.
  - Tailwind classes follow the palette names: `bg-gold`, `text-starlight`, `bg-nebula-deep`, `ring-gold/50`.
- **Themes:** `dark` (default), `light` (legal, long reads) and `frontier` (S3 "the turn"). Re-theme a band with `<Section theme="frontier">`. The semantic tokens `primary`, `secondary` and `contrast` remap per theme.
  - **Contrast:** WCAG AA passes everywhere.
  - On the frontier theme, the APCA check scores `contrast` (gold-frontier) at about Lc 46. It is accepted in `contrast-baseline.json` for display type and accents only, never body copy.
- **Fonts: `next/font/google` replaces `public/fonts/` web fonts.** The files are downloaded at build time and self-hosted, so visitors make no requests to Google; the build machine needs internet access.
  - Bodoni Moda goes in `--next-font-display`, Inter in `--next-font-body`, and Archivo Narrow in `--next-font-mono` (the button and label slot).
  - `public/fonts/typeface/` still holds the 3D `Text3D` JSON (P4).
- **Type utilities:** `display`, `h1`–`h4`, `p-big`, `p`, `caption`, `eyebrow`, `cta` and `link`, all generated from `lib/styles/typography.ts`.

### D. Contracts and forms

- **Contracts:** `lib/contracts` is v1 and frozen after P1.
  - `bun run contracts:openapi` regenerates `openapi.json`.
  - `bun run contracts:check` fails when it is stale.
- **Changes from §5.1:**
  1. **Repeated writes:** a repeated `Idempotency-Key` replays the **first response** (202 with the same `ref`, or 201 with the same appointment). It is **never 409**; `409` means `slot_taken` only.
  2. **Error envelope:** every error is `{ error: { code, message, fields? } }`, where `fields` maps a contract path (`email`, `contact.phone`) to a message. Satus's `{ data, error }` shape from `app/api/README.md` does **not** apply to `/api/v1`.
  3. **SMS consent:** `consent.sms: true` requires a phone, and a lead of type `package` requires `packageInterest` (both enforced by the schema).
- **Front end:** call `api.*` from `lib/contracts/client.ts`. It never throws, and it validates every success body against the contract.
  - Create one idempotency key per submission with `newIdempotencyKey()` and reuse it on retry.
  - In a Satus `<Form>` action, return `toFormState(result, successMessage)`.
  - Name inputs after their contract path.
  - Any 2xx counts as success. **No react-hook-form:** use Satus `<Form>` and its fields, with `zodToValidator()` for client checks.
- **Mocks:** set `NEXT_PUBLIC_API_MOCKS=1` to turn on the MSW worker (`public/mockServiceWorker.js`).
  - Magic values reach the error paths: a `taken@…` email gives 409, `@ghl-down.test` gives 202 queued, `@ratelimit.test` gives 429, and altcha `fail` gives 400. They are listed in `lib/contracts/mocks/handlers.ts`.
- **Env names are frozen** in `lib/env.ts` and `.env.example`: `DATABASE_URL`, `PAYLOAD_SECRET`, `GHL_PIT`, `GHL_LOCATION_ID`, `GHL_CALENDAR_ID`, `GHL_PIPELINE_ID`, `GHL_STAGE_NEW_ID`, `GHL_STAGE_CALL_BOOKED_ID`, `GHL_WORKFLOW_SECRET`, `ALTCHA_HMAC_KEY` and `NEXT_PUBLIC_API_MOCKS`. Read them through `import { env } from '@/lib/env'`.

### E. Motion and 3D

- **Lenis is already wired.** It runs on Tempus, with the anime.js bridge inside Satus `<Wrapper>`, so there is no separate `MotionProvider`.
- **Reduced motion:** the plan's `useReducedMotion()` is Satus `usePreferredReducedMotion()`.
- **Helpers are hooks in `components/motion`**, and anime.js loads lazily inside them:
  - `useSplitReveal(ref)`
  - `useDrawPath(ref)` (strokes marked `[data-draw]`)
  - `useScrollLinked(ref, params)`
  - `useScrollProgress(cb, {start, end})` (built on hamo `useScrollTrigger`)
  - The plan's `reveal()` is Satus `useReveal` (CSS, compositor-only).
- **Don't hide server-rendered above-the-fold text while waiting for JS.** Hiding it delays LCP and causes a visible flash. The hero headline therefore uses a CSS line rise on first paint; `useSplitReveal` is for text further down the page.
- **Device tiers** (`useDeviceTier()`, `components/motion/device-tier-rules.ts`):

  | Tier | Rule                                                                                                       |
  | ---- | ---------------------------------------------------------------------------------------------------------- |
  | 0    | Reduced motion or Save-Data                                                                                |
  | 1    | No live WebGL (touch-only, under 800 px, software GPU), detect-gpu ≤ 1, or a mobile GPU with ≤ 4 GB memory |
  | 2    | detect-gpu 2                                                                                               |
  | 3    | detect-gpu 3                                                                                               |
  - Use the flags `state.motionMedia`, `state.liveWebGL`, `state.bloom` and `state.maxDpr`.
  - `state` is `undefined` until detection finishes, so render the static version first.
  - Phones get video and frame sequences, never live WebGL. This follows Satus's gate and keeps scrolling smooth.
  - detect-gpu's benchmark data is self-hosted in `public/gpu-benchmarks/`, so there is no unpkg request.

- **3D:** use Satus's persistent root `<Canvas>` (`lib/features`) with `<WebGLTunnel>` and `useWebGLRect`, which is the r3f-scroll-rig pattern already built in.
  - The canvas renders on demand, so call `useHoldAwake` while animating.
  - Bloom goes through vanilla `postprocessing` (Satus `PostProcessing`); `@react-three/postprocessing` is not installed.
  - Read colours from `brand`, never from literals.

### F. Hosting

- **Build output:** `output: 'standalone'` is set.
- **Dormant Satus code:** Satus's Vercel fallbacks (`VERCEL_*` env, `vercel.json`) and the Turnstile integration stay in place but unused. Never configure them; ALTCHA is the captcha.
- **Local database:** `bun run db:up` starts Postgres 17 (`docker-compose.dev.yml`, `DATABASE_URL=postgres://hnst:hnst@localhost:5432/hnst`).

### G. Brand assets in code

- **`<Logo>`** (`components/ui/logo`) is the Brand Bible primary mark. Its paths are generated from `Logo_Transparent.svg`, and its gradient stops are mapped to `gold-metal-1…4`.
  - The tagline "Powered by HONEST SuperIntelligence" is set in Helvetica Neue LT Pro in the artwork. We don't have that font, so `<Logo tagline>` renders the line as live text in Archivo Narrow.
- **`<HorizonDivider>`** is the planet-rim gold arc, and its stroke can be drawn with `useDrawPath`.

### H. Localhost first; the VM is deferred (Nafew, 30 Oct 2026)

Every phase is built and accepted **on localhost**. There is no VM, staging hostname or public URL until the Founder says go. The deploy files from P2 (`Dockerfile.web`, `Dockerfile.worker`, `deploy/`) stay in the repo, ready but unused.

- **Local stack:**
  - Postgres: `bun run db:up` (port 5432), or `deploy/docker-compose.localhost.yml` (port 5433) when 5432 is taken.
  - Site: `bun dev`, or `bun run build && bun run start` for production checks.
  - Worker: `bun worker/index.ts`.
  - Migrations and GHL setup: `bun scripts/migrate.ts` and `bun scripts/ghl-setup.ts`.
  - Secrets live in the git-ignored root `.env` on Nafew's Mac (the GHL token included). Never commit it.
- **Test data in GHL:** leads sent from localhost create **real** contacts and opportunities in the HONEST sub-account. Use `@example.com` emails and delete test records before launch.
- **Media:** P5's `publish` copies processed clips and frame sets into `public/media/<hash>/`, which is git-ignored, so `/media/...` URLs work in `bun dev`. On the VM, the same paths come from `/srv/media` through Caddy.
- **Phones on localhost:** for real-device checks (P10), run `bun run start -- -H 0.0.0.0` and open `http://<mac-lan-ip>:3000` on a phone on the same Wi-Fi.

**What each phase does on localhost, and what moves to Go-live:**

| Phase | Accepted on localhost                                                                                                                                                              | Moved to Go-live                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P2    | Leads API and worker deliver to GHL from the local stack. The repeated key gives one contact. Backup and restore against local Postgres. **Done 30 Oct.**                          | VM, SSH, staging HTTPS, building and running `deploy/docker-compose.yml`, `deploy.sh` rollback |
| P5    | Slots, bookings, offers and events against GHL from localhost. `publish` copies media into `public/media/`. The webhook route is tested by posting to `localhost` with the secret. | Pointing the GHL "offer changed" workflow at the public URL; rsync to `/srv/media`             |
| P8    | Rate limits, ALTCHA replay, load test against the local production build, DLQ tools, secrets runbook, restore drill on local Postgres                                              | Uptime Kuma alerts, Caddy and ufw security headers, VM restore drill                           |
| P9    | Unchanged: runs against the local production build                                                                                                                                 | n/a                                                                                            |
| P10   | Performance, polish, real devices over the LAN, final CSP                                                                                                                          | Production cut-over and `v1.0.0`                                                               |

**Go-live** is a new step after P10. Grok runs it with Nafew once the Founder says go:

1. Provision the VM (Ubuntu 24.04, ports 22/80/443, SSH keys) and copy `.env` to it (chmod 600).
2. Point `staging.hnst.marketing` at the VM, set `SITE_ADDRESS` and `SITE_PASSWORD`, and run `deploy/deploy.sh`.
3. Point the GHL workflow webhook at `https://<host>/api/webhooks/ghl-workflow/<secret>`.
4. Install the crontab, run a restore drill on the VM, and set up Uptime Kuma alerts.
5. Run the launch QA script (§9), get the Founder's sign-off, switch DNS to `hnst.marketing`, and tag `v1.0.0`.

---

## TL;DR

- **10 build phases in 4 waves.** Each phase belongs to exactly one coder. Phases in the same wave run in parallel, because they touch different folders.

  | Wave                             | Claude                                        | Astra                                | Grok                                                                                   |
  | -------------------------------- | --------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
  | 1 (Days 1–3)                     | **P1** Foundation                             | —                                    | —                                                                                      |
  | 2 (Days 4–9)                     | **P4** 3D world + motion library              | **P3** CMS, core pages, forms        | **P2** Back-end core + self-hosted staging                                             |
  | 3 (Days 10–17)                   | **P7** Signature homepage sections            | **P6** Remaining pages + booking UI  | **P5** Media pipeline + booking/offers/events API                                      |
  | 4 (Days 18–22)                   | **P10** Performance, polish, launch readiness | **P9** QA, accessibility, SEO audits | **P8** Hardening and ops                                                               |
  | Go-live (after the Founder's go) | Nafew: QA script, Founder sign-off, DNS       |                                      | **Go-live**: VM, staging, `deploy.sh`, GHL webhook, monitoring (§ Satus adaptations H) |

- **Hosting: 100% free and open source, on your own VM, but only at Go-live.** Until then every phase runs on localhost (§ Satus adaptations H). The target setup:
  - Docker Compose: `web` (Next.js standalone) + `worker` + `postgres:17` + `caddy` (automatic HTTPS, serves the media files) + `uptime-kuma`.
  - Backups: nightly `pg_dump`.
  - No Vercel, Neon, Cloudflare or Railway.
- **Stack:**
  - Next.js 16 + React 19 + Tailwind v4 (forked from `darkroomengineering/satus`, MIT).
  - Payload 3 CMS on your Postgres.
  - React Three Fiber + Three.js r186 for 3D.
  - **anime.js 4.5** for all animation.
  - Lenis for smooth scroll.
  - pg-boss (a Postgres-based job queue) for the worker.
  - Official `@gohighlevel/api-client` for GoHighLevel.
- **Animation engine: anime.js 4.5.x (MIT), no GSAP.** It covers everything the site needs:
  - `splitText` for headline reveals
  - `svg.createDrawable` for the logo arc drawing itself
  - `svg.morphTo` and `createMotionPath`
  - `onScroll({ sync })` for scroll-linked animation
  - the Layout module for package-card reshuffles
  - `stagger` and timelines
  - the **built-in Three.js adapter** (`animejs/adapters/three`, added in 4.5.0), so one timeline drives both the page and the 3D scene

  Pinned sections use CSS `position: sticky`, and the scroll-video player reads Lenis's scroll progress. Stay on 4.5.x; v5 is still beta.

- **Colours live in one file, `brand.config.ts`.** A script generates the CSS variables and the Tailwind theme from it, the 3D and shader code read the same file, and a lint rule rejects any colour hex code typed anywhere else. Gold `#c1b38d` is **approved**. The nebula "infinity cloud" gas gets its own purple palette (glow `#8b6fc0`, haze `#5a4a67`, deep `#2a1f3d`), which you can tune at any time.
- **3D is all code** (no Blender):
  - the gold HNST emblem, extruded from the logo file;
  - purple nebula gas and a starfield made with shaders;
  - the golden platter with 6 deliverable props and 26 orbiting bots;
  - a dune terrain and a gold-glint shader.
- **Video: Grok Imagine.** Prompts for 6 clips, ready to paste, are in §8. They are updated with the purple nebula gas.
- **Your asset order** (§6) follows the waves: GHL setup and VM → copy and legal text → hero style frame → clips → proof and about content.
- **Fonts:** free and self-hosted (Bodoni Moda, Inter, Archivo Narrow), chosen in `brand.config.ts`. You can switch to the licensed Bodoni URW / Helvetica / Anzeigen later by editing that one file.

---

## 1. What we are building (fixed)

**Routes:**

| Route                                                                    | Built in                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------- |
| `/` (cinematic homepage)                                                 | P7 (Claude)                                    |
| `/packages`, `/packages/[tier]` (basic-diy, executive, founder, diamond) | P3 (Astra), using the reveal component from P7 |
| `/contact`, `/legal/[slug]`, `/thanks/[type]`, `404`, `/link-in-bio`     | P3 (Astra)                                     |
| `/how-it-works`, `/about`, `/proof`, `/the-honest-marketer`, `/book`     | P6 (Astra)                                     |
| `/admin` (Payload CMS)                                                   | P3 (Astra)                                     |
| `/lab`, `/lab/3d` (internal component showcase, `noindex`)               | P1 and P4 (Claude)                             |

**The 7 homepage sections** (built in P7, using P4's 3D):

| #   | Section                        | Wow moment                                                                                                                                  | Static version (reduced motion or weak device) |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| S1  | Hero: "Enter HONEST Marketing" | Purple nebula gas + planet-rim video loop. The gold 3D emblem turns, the arc draws itself, the starburst flares, and the headline splits in | Poster + flat SVG logo                         |
| S2  | "Back in my day…" scroll film  | Scrolling plays the film forward and backward (chapters 1–3)                                                                                | Chapter stills that cross-fade                 |
| S3  | The turn                       | The palette shifts from nebula to frontier gold over a dune terrain                                                                         | Static frontier image                          |
| S4  | The golden platter             | The platter rises, 6 deliverables materialise, and 26 bots orbit                                                                            | Rendered still + HTML list                     |
| S5  | How it works                   | The logo arc becomes a progress line, and steps light up in gold                                                                            | Numbered steps                                 |
| S6  | Package reveal                 | Cards forge out of molten gold, strikethrough prices animate, and the Founder Package gets the spotlight                                    | Static cards                                   |
| S7  | Proof → booking CTA            | Real "client zero" screens scroll past, ending on a gold booking CTA                                                                        | Static gallery                                 |

---

## 2. Fixed technical decisions

### 2.1 Versions (pin these)

| Area           | Choice                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime        | Node 24 LTS (≥24.20), Bun ≥1.4 for install/dev/build, `node:24-alpine` to run                                                                                             |
| App            | Next.js 16.4.x (App Router, `output: 'standalone'`), React 19, TypeScript strict, Tailwind v4                                                                             |
| CMS            | `payload@3.92.x`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`                                                                           |
| Database       | PostgreSQL 17 (`postgres:17-alpine`)                                                                                                                                      |
| Animation      | `animejs@~4.5.0`, `lenis@1.3.x`                                                                                                                                           |
| Frame loop     | Tempus (from Satus)                                                                                                                                                       |
| 3D             | `three@0.186`, `@react-three/fiber@9.8`, `@react-three/drei@10.7`, `@react-three/postprocessing`, `detect-gpu`                                                            |
| Back end       | `zod`, `@asteasolutions/zod-to-openapi`, `pg-boss`, `node-pg-migrate`, `bottleneck`, `pino`, `@gohighlevel/api-client`                                                    |
| Forms          | `react-hook-form` + `@hookform/resolvers`                                                                                                                                 |
| Anti-spam      | `altcha` (self-hosted proof-of-work captcha, MIT) + honeypot                                                                                                              |
| Cookie consent | `vanilla-cookieconsent` (MIT)                                                                                                                                             |
| Testing        | Vitest (unit), Playwright + `@axe-core/playwright` (end-to-end and accessibility), `@lhci/cli` (Lighthouse), `msw` (API mocks), `autocannon` (load), `linkinator` (links) |
| Ops            | Docker Compose, Caddy 2, Uptime Kuma, cron + `pg_dump`                                                                                                                    |
| CI             | GitHub Actions (free tier, checks only). Deploys run with `deploy/deploy.sh` on the VM                                                                                    |

### 2.2 Animation rules (anime.js 4.5)

- **Import style:** `import { animate, createTimeline, stagger, splitText, svg, onScroll, utils } from 'animejs'`. For 3D, also run the side-effect import `import 'animejs/adapters/three'`.
- **Scroll-linked:**
  - `animate(target, { …, autoplay: onScroll({ sync: true, enter: 'bottom top', leave: 'top bottom' }) })`.
  - Use smoothing sync modes only where the docs confirm the syntax.
  - Lenis owns the smooth scrolling.
- **Pinning:** CSS `position: sticky` inside a tall wrapper (`height: 300vh`). No JavaScript pinning.
- **Scroll-video (`ScrollSequence`):** works out progress from the wrapper's position plus Lenis scroll, and draws `frames[round(progress × (n − 1))]` onto a canvas.
- **One frame loop:**
  - Lenis and R3F tick from Tempus.
  - anime.js uses its own engine. If the docs' `engine` page confirms manual update, drive it from Tempus.
- **Reduced motion:**
  - `prefers-reduced-motion: reduce` means no scroll-linked motion, no autoplay video and no 3D render loop; static versions are shown instead.
  - The `useReducedMotion()` hook gates all of this.

### 2.3 Device tiers (`DeviceTierProvider`, P1)

| Tier | Rule                                                   | Gets                                                                  |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 0    | Reduced motion, Save-Data, or no WebGL                 | Static versions only                                                  |
| 1    | `detect-gpu` tier ≤1, or mobile with `deviceMemory` ≤4 | Video and frame sequences; simplified emblem only; no post-processing |
| 2    | `detect-gpu` tier 2                                    | Full 3D, no bloom                                                     |
| 3    | `detect-gpu` tier 3                                    | Full 3D + bloom + higher DPR (up to 1.5)                              |

### 2.4 Colour config: `brand.config.ts`

Superseded by the file itself: `brand.config.ts` holds every colour (OKLCH, original hex in comments), the gradients, fonts, 3D and motion constants. `bun run tokens` regenerates the CSS, and `bun run check:colors` rejects hex values anywhere else. See § Satus adaptations C.

### 2.5 Hosting on your VM (all open source)

- **VM:** Ubuntu 24.04 LTS, 4 vCPU, 8 GB RAM, 80 GB SSD (minimum 2 vCPU / 4 GB). Ports 22, 80 and 443 only (ufw).
- **Docker Compose services:**

  | Service  | What it runs                                                                                                                                   |
  | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
  | `web`    | Next.js standalone, port 3000                                                                                                                  |
  | `worker` | Node, pg-boss                                                                                                                                  |
  | `db`     | postgres:17-alpine, volume `pgdata`                                                                                                            |
  | `caddy`  | Automatic Let's Encrypt HTTPS; proxies to `web`; serves `/media/*` from `/srv/media` with `Cache-Control: public, max-age=31536000, immutable` |
  | `uptime` | Uptime Kuma                                                                                                                                    |

- **Media** (frame sequences, posters, video loops) lives on disk at `/srv/media`, with hashed file names.
- **Backups:** `deploy/backup.sh` runs nightly via cron: `pg_dump` to `/srv/backups`, keeps 14 days, plus a weekly tar of `/srv/media`. Copying it off the server is optional (rclone to any drive you choose).
- **Deploys:** `deploy/deploy.sh` does git pull → build → migrate → `docker compose up -d` → health check → automatic rollback to the previous image if the health check fails.

---

## 3. Common Rules (paste this before every phase brief)

```text
PROJECT: hnst-web — HONEST Marketing website. Repo forked from darkroomengineering/satus. Read /docs/PLAN.md §2 (fixed decisions) before coding. Do not change any decision; if something blocks you, stop and write the question in your PR description.
OWNERSHIP: You may ONLY create/edit files listed under "Files you own" in your phase. Shared files (package.json, bun.lock, tsconfig*, next.config.*, brand.config.ts, .env.example, CODEOWNERS, docker/deploy files unless your phase owns them) belong to Claude — request changes in the PR description.
CONTRACTS: lib/contracts is the source of truth for every API request/response. Never edit it. Front end uses MSW mocks when NEXT_PUBLIC_API_MOCKS=1.
COLOURS/FONTS: never type a hex colour or font name — use CSS variables / Tailwind theme / import { brand } from '@/brand.config'.
ANIMATION: anime.js 4.5 only (no GSAP, no framer-motion). Respect useReducedMotion() and DeviceTier.
BRANCH: <coder>/<phase>-<feature> (e.g., grok/p2-leads-api). PR into dev. Small commits, conventional messages.
DONE MEANS: typecheck + lint + unit tests pass; your phase's acceptance criteria are demonstrably met (write how you verified them in the PR); no console errors; no secrets in code or client bundles; README/docs updated for anything you added.
NEVER: add dependencies without listing them in the PR for approval; delete others' files; commit .env; call GoHighLevel from the browser.
```

---

## 4. Phase briefs

### P1: Foundation (owner: Claude, Wave 1, about 3 days)

**Nafew provides before start:** an empty GitHub repo `hnst-web`, and confirmation that the gold `#c1b38d` is approved (done).
**Goal:** a running skeleton that every other phase can build on safely.

**Status: done (30 Oct 2026, tag `p1-foundation`).** The as-built layout and every deviation are in § Satus adaptations at the top of this file. The original brief is kept below for reference.

**Tasks**

1. **Fork Satus:** fork `darkroomengineering/satus` at its latest v3 tag into `hnst-web`. Check Node ≥24.20 and Bun ≥1.4, and record the versions in the README.
2. **Remove from Satus:**
   - the Sanity integration;
   - the Shopify, HubSpot and Mailchimp integrations;
   - any Vercel-only code or config.

   Set `output: 'standalone'` in `next.config`.

3. **Keep from Satus:** Next 16, React 19, Tailwind v4, R3F/drei/three, Lenis, Tempus, **anime.js** (pin `~4.5.0`), Playwright, CSP and the SEO helpers.
4. **Add every dependency** in §2.1 (this includes the back-end ones, so other coders never need to touch `package.json`).
5. **Create the folder layout and CODEOWNERS:**

   ```text
   brand.config.ts                 (Claude)
   lib/contracts/             (Claude)  zod schemas, types, openapi.json, mocks/
   lib/ghl/                   (Grok)
   worker/                         (Grok)
   db/migrations/                  (Grok)    node-pg-migrate, schema "integration"
   scripts/media/  scripts/ghl-setup.ts      (Grok)
   deploy/  Dockerfile.web  Dockerfile.worker (Grok)
   app/(site)/page.tsx         (Claude)
   app/(site)/**  (other routes)          (Astra)
   app/(payload)/**  payload.config.ts  lib/cms/**  (Astra)
   app/api/**                  (Grok)
   components/ui|motion|three/ (Claude)
   components/sections/signature/         (Claude)
   components/sections/standard/  components/forms/  lib/track.ts  (Astra)
   lib/ghl-read/               (Grok)
   tests/e2e/ .github/workflows/   (Astra)
   tests/unit/backend/             (Grok)    tests/unit/frontend/ (Astra)
   docs/                           (Claude)
   ```

6. **Brand config:**
   - `brand.config.ts` exactly as in §2.4.
   - `scripts/build-tokens.ts` generates `src/styles/tokens.css` and the Tailwind `@theme` mapping.
   - The hex-colour lint rule.
   - Self-hosted OFL fonts in `public/fonts/`, loaded with `next/font/local` according to the config.
7. **Contracts** in `lib/contracts/`:
   - Files: `leads.ts`, `booking.ts`, `events.ts`, `offers.ts`, `errors.ts`, `consent.ts`, matching §5.1 exactly.
   - Generate `openapi.json`.
   - `mocks/handlers.ts` (MSW) returns realistic sample data, including slow (800 ms) and error cases, switched on by `NEXT_PUBLIC_API_MOCKS=1`.
8. **Motion core** in `components/motion/`:
   - `MotionProvider`: a single Lenis instance on Tempus, with anime.js set up.
   - `useReducedMotion`.
   - `DeviceTierProvider` and `useDeviceTier`, following the rules in §2.3.
   - `useScrollProgress(ref)`.
   - Helpers:

     | Helper           | Built on                              |
     | ---------------- | ------------------------------------- |
     | `reveal()`       | fade/rise with stagger                |
     | `splitReveal()`  | `splitText` by lines, then words      |
     | `drawPath()`     | `svg.createDrawable`                  |
     | `scrollLinked()` | an `onScroll({ sync: true })` wrapper |

9. **UI primitives** in `components/ui/`:
   - Button: gold with void-coloured text; ghost; link.
   - Input, Textarea, Select, Checkbox, RadioGroup (each with error and description slots).
   - Card, Badge, Container, Section, Heading (display, H1–H4), Eyebrow.
   - Nav (desktop, plus a mobile drawer with focus trap), Footer.
   - `HorizonDivider` (the logo-arc SVG).
   - A Toast for form results.
   - A `/lab` page (noindex) that shows everything.
10. **Static hero v0 on `/`:**
    - temporary nebula gradient background built from the tokens;
    - SVG logo (`Logo_Transparent.svg` with the tagline converted to outlines);
    - `splitReveal` on the headline;
    - two CTAs: "Book a call" and "See packages".
11. **Local dev:** `docker-compose.dev.yml` runs `db` only. Write a complete `.env.example`.
12. **Docs:**
    - copy this plan to `docs/PLAN.md`;
    - each phase brief to `docs/phases/P2.md … P10.md`;
    - the Common Rules to `docs/RULES.md`.

**Acceptance criteria**

- `bun i && docker compose -f docker-compose.dev.yml up -d && bun dev` works on a clean machine.
- Changing `colors.gold` in `brand.config.ts` and running `bun run tokens` re-colours `/lab`.
- A hex value in any other file fails lint.
- MSW mocks answer every contract endpoint.
- `/` reaches Lighthouse mobile ≥90.
- Reduced motion shows no movement.

**Hand-off:** tag `p1-foundation`. Contracts v1 are now **frozen**.

---

### P2: Back-end core + self-hosted staging (owner: Grok, Wave 2, about 4 days, parallel with P3 and P4)

**Nafew provides before start:**

- the GHL setup from §5.3: a Private Integration Token (PIT), location ID, "Website Leads" pipeline ID and its "New" stage ID, and the Discovery Call calendar ID;
- the VM's IP address with SSH access;
- a staging hostname (e.g. `staging.hnst.marketing` pointed at the VM; otherwise use `<ip>.sslip.io`).

**Files you own:** `lib/ghl/**`, `worker/**`, `db/migrations/**`, `scripts/ghl-setup.ts`, `app/api/v1/leads/**`, `app/api/health/**`, `deploy/**`, `Dockerfile.web`, `Dockerfile.worker`, colocated `*.test.ts`.

**Tasks**

1. **Migrations** (node-pg-migrate, schema `integration`):
   - `outbox(id uuid pk, idempotency_key text unique not null, type text, payload jsonb, status text default 'queued', attempts int default 0, ghl_contact_id text, ghl_opportunity_id text, last_error text, created_at timestamptz default now(), updated_at timestamptz)`
   - `consent_log(id uuid pk, email text, phone text, sms boolean, email_marketing boolean, consent_text text, ip inet, user_agent text, page_url text, created_at timestamptz default now())`
   - `webhook_receipts(id text pk, source text, received_at timestamptz default now())`
   - `event_buffer(id bigserial pk, anon_id text, email text, name text, props jsonb, ts timestamptz)`
2. **`lib/ghl`:**
   - A client from env `GHL_PIT` and `GHL_LOCATION_ID`, using the header `Version: 2021-07-28`.
   - Typed helpers: `upsertContact`, `addNote`, `upsertOpportunity`, `addTags`, `getFreeSlots`, `createAppointment`, `getCustomValues`, `listProducts`.
   - On HTTP 429, read the retry headers and back off.
   - Typed errors.
3. **`scripts/ghl-setup.ts`** (safe to run repeatedly):
   - Creates every custom field and tag in §5.3.
   - Prints the resulting IDs as `.env` lines.
4. **`POST /api/v1/leads`** (Node runtime):
   1. Validate with `LeadInput` from contracts.
   2. Verify the ALTCHA payload and check the honeypot.
   3. Require the `Idempotency-Key` header.
   4. In one transaction, insert the `outbox` row and the `consent_log` row.
   5. Queue a pg-boss job `ghl.lead` with `singletonKey` = the idempotency key.
   6. Return `202 { status: 'queued', ref }`.
   7. A repeated key replays the **first** response (same status and body, e.g. `202` with the same `ref`). Never `409` (PLAN § Satus adaptations D).
5. **Worker** (`worker/index.ts`, pg-boss):
   - Job `ghl.lead`:
     1. `upsertContact` with tags `src:website`, `lead:<type>`, `pkg:<tier>` and the UTM and consent fields.
     2. `addNote` with the message and page URL.
     3. `upsertOpportunity` in the pipeline at stage New.
   - Save the IDs on the outbox row after **each** step, so a retry resumes where it stopped.
   - Throttle with `bottleneck` at 8 requests per second.
   - Retry up to 8 times with exponential backoff and jitter, then move the job to `ghl.lead.dlq`.
   - Write pino JSON logs.
   - If a contact has SMS consent = false, set DND on SMS.
6. **Docker and Caddy:**
   - `Dockerfile.web`: build with Bun, run Next standalone on node:24-alpine as a non-root user.
   - `Dockerfile.worker`.
   - `deploy/docker-compose.yml`: web, worker, db, caddy, uptime.
   - `deploy/Caddyfile` with `/media/*` served from `/srv/media` (immutable cache).
   - `deploy/deploy.sh`: pull, build, run migrations (`node-pg-migrate up` + `payload migrate`), `up -d`, poll `/api/health`, and roll back to the previous image tag on failure.
   - `deploy/backup.sh` + its crontab line.
   - `deploy/README.md` with a step-by-step VM setup (Docker install, ufw, users, `.env` at chmod 600).
7. **Health checks:** `/api/health` checks the database. The worker writes a heartbeat row every 30 s.
8. **Tests** (`bun test`, colocated `*.test.ts`; inject a fake GHL client, because the anti-slop lint plugin bans module mocking):
   - validation errors;
   - idempotency;
   - resume after a partial failure;
   - DLQ after 8 failures.

**Acceptance criteria**

- Posting the same lead 3 times creates **one** GHL contact and **one** opportunity, with tags, UTMs and consent fields.
- Killing the worker mid-job and restarting it completes the job with no duplicates.
- The staging URL serves P1's site over HTTPS.
- `backup.sh` produces a dump that restores into a fresh database.

**Out of scope:** UI, booking, offers, events.

---

### P3: CMS, core pages, forms (owner: Astra, Wave 2, about 4 days, parallel with P2 and P4)

**Nafew provides before start:**

- package facts from the Master Tier Table (names, prices, values, turnaround, revisions, bots, deliverables);
- draft legal text (Privacy, Terms, SMS terms, 4 package T&Cs), with placeholders marked "DRAFT";
- the contact email;
- the SMS and email consent text, Founder-approved or marked DRAFT.

**Files you own:** `payload.config.ts`, `lib/cms/**`, `app/(payload)/**`, `app/(site)/**` (except `page.tsx`, `layout.tsx` and `lab/**`), `app/sitemap.ts`, `app/robots.ts`, `lib/seo/**`, `components/sections/standard/**`, `components/forms/**`, `lib/track.ts`, `e2e/**`, colocated `*.test.ts`, `.github/workflows/**`.

**Tasks**

1. **Payload setup:**
   - `@payloadcms/db-postgres` on the same database (default schema), Lexical rich text, admin at `/admin`.
   - Roles: `admin` (full access) and `editor` (content only).
   - Media uploads go to `/srv/media/uploads` in production and `./media` in dev.
2. **Collections** (exact fields):

   | Collection              | Fields                                                                                                                                                                                                                                                                                                                             |
   | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `Packages`              | tier (select: basic-diy / executive / founder / diamond), name, slug, price (number), valueLabel (e.g. "$15,000 value"), turnaround, revisions, bots (number), deliverables (array of {title, description}), highlight (checkbox, true only for founder), order, ctaLabel, ctaType (book / buy / contact), legalDoc (relationship) |
   | `LegalDocs`             | title, slug, body (rich text), version, effectiveDate, status (draft / published)                                                                                                                                                                                                                                                  |
   | `FAQs`                  | question, answer, category (process / ownership / pricing / tools / timeline), order                                                                                                                                                                                                                                               |
   | `Pages`                 | title, slug, seo{title, description, ogImage}, blocks (Hero, RichText, FAQList, CTA, PackageGrid, ComparisonTable)                                                                                                                                                                                                                 |
   | `Media`                 | standard Payload media collection                                                                                                                                                                                                                                                                                                  |
   | `SiteSettings` (global) | companyLegalName, address, publicEmail, publicPhone, consentTexts{sms, email}, footerLinks, socialLinks (hidden when empty), announcementBar                                                                                                                                                                                       |

3. **Seed script:** `bun run seed` loads the 4 packages, the legal drafts and 10 FAQ placeholders.
4. **Pages:**

   | Route              | Content                                                                          |
   | ------------------ | -------------------------------------------------------------------------------- |
   | `/packages`        | PackageGrid + ComparisonTable + a tool-cost disclosure block (from SiteSettings) |
   | `/packages/[tier]` | package detail: hero, deliverables, turnaround, FAQ, CTA, link to its T&C        |
   | `/contact`         | ContactForm                                                                      |
   | `/legal/[slug]`    | legal document                                                                   |
   | `/thanks/[type]`   | contact / magnet / booking / package                                             |
   | 404                | custom page                                                                      |
   | `/link-in-bio`     | list of links                                                                    |

   All pages are server-rendered and use the UI primitives.

5. **Forms** (`ContactForm`, `PackageInterestForm`, `MagnetForm`):
   - Satus `<Form>` and fields (`components/ui/form`). The form action calls `api.submitLead()` from `lib/contracts/client.ts` and returns `toFormState()`. Client checks use `zodToValidator()` with the contract schemas. No react-hook-form.
   - One `Idempotency-Key` per submission (`newIdempotencyKey()`), reused on retry and renewed after success.
   - The ALTCHA widget, plus a hidden honeypot field.
   - UTMs captured from the URL into `sessionStorage` on the first page view.
   - Inline errors.
   - Success redirects to `/thanks/[type]`.
6. **Consent UI:**
   - Phone is optional.
   - A **separate, unchecked** SMS checkbox that shows the exact `SiteSettings.consentTexts.sms`.
   - An email consent line.
   - The exact consent text shown is sent in the payload.
7. **Cookie consent:**
   - `vanilla-cookieconsent` with the categories necessary and analytics.
   - The GHL External Tracking script loads **only** after analytics consent.
8. **SEO:**
   - `generateMetadata` from the CMS.
   - Extend Satus's existing `app/sitemap.ts`, `app/robots.ts` and `lib/seo/**` (JSON-LD helpers and `SITE` facts already exist).
   - An OG image route with `next/og`.
   - JSON-LD for `Organization` (sitewide), `Service` (each package) and `FAQPage`.
9. **`lib/track.ts`:** `track(name, props)` batches events and posts them to `/api/v1/events` every 10 s or on page hide (`sendBeacon`). The events are `pricing_viewed`, `package_clicked`, `cta_clicked` and `video_completed`.
10. **CI** (extend Satus's `.github/workflows/ci.yml`, which already runs `bun run check` and the build; remove its Vercel comments, as we deploy to the VM):
    - `bun run check` (lint, format, types, unit tests, colours, contracts, contrast);
    - Playwright end-to-end in Chromium and WebKit, with axe;
    - Lighthouse CI (budgets: performance ≥90 on `/`, ≥95 elsewhere; accessibility ≥95).
11. **End-to-end tests** (using mocks):
    - contact happy path;
    - validation errors;
    - a duplicate submit shows success once;
    - every page has no serious axe issues.

**Acceptance criteria**

- An editor can change a package price in `/admin` and see it on `/packages`.
- All forms work against the mocks and, with mocks off, against P2's real API.
- Lighthouse and axe gates pass.
- Keyboard-only users can complete every form.

---

### P4: 3D world + motion library (owner: Claude, Wave 2, about 5 days, parallel with P2 and P3)

**Nafew provides before start:** nothing new; the logo SVG already exists.
**Files owned:** `components/three/**`, `components/motion/**` (extended), `app/(site)/lab/3d/**`, `public/fonts/typeface/**`, `public/posters/**`.

**Tasks**

1. **Canvas:** reuse Satus's persistent root `<Canvas>` (`lib/features`) with `<WebGLTunnel>` and `useWebGLRect` (the r3f-scroll-rig pattern, already built in). Do not add a second canvas.
   - `<ViewportScene trackRef>` is a thin wrapper over `<WebGLTunnel>` + `useWebGLRect`.
   - Render on demand: `useHoldAwake(visible)` while a scene animates (`lib/webgl/utils/awake.ts`).
   - DPR capped at 1.25 on mobile and 1.5 on desktop.
   - Tier gating: `useDeviceTier()` (`state.liveWebGL`, `state.bloom`, `state.maxDpr`).
2. **Gold material and lighting:**
   - `goldMaterial()` is a `MeshPhysicalMaterial` with colour `brand.palette.gold` (convert the OKLCH string with three's `Color`), metalness 1, and roughness and clearcoat from `brand.three`. A small procedural normal-noise texture gives a brushed feel.
   - `StudioLights`: drei `<Environment>` with Lightformers (a warm key, a violet rim from `nebula.glow`, two fills).
   - Bloom from `brand.three.bloomStrength`, at tier 3 only, through vanilla `postprocessing` (`BloomEffect` in Satus's `PostProcessing` composer).
3. **`Emblem3D`:**
   - Use the starburst and wordmark paths from `components/ui/logo/paths.ts` and the arc from `<HorizonDivider>` → `ExtrudeGeometry` (depth 0.08, bevel 0.015, 6 segments).
   - The letters "HNST" use drei `Text3D` with the Bodoni Moda typeface JSON (converted with facetype.js, stored in `public/fonts/typeface/`).
   - Props: `drawProgress` (the arc is revealed by a clipping plane), `flare` (the starburst rays scale with emissive glow), `idle` (±12° yaw).
   - anime.js Three adapter timelines drive these props.
4. **`NebulaGas`:**
   - A full-screen shader plane: fbm noise (5 octaves) with domain warping, coloured from `nebula.deep` through `nebula.haze` to `nebula.glow`, with `nebula.tint` on the edges.
   - Slow drift (`brand.three.nebulaSpeed`), density from `brand.three.nebulaDensity`.
   - Gentle mouse parallax on desktop.
   - Optional "light from behind" uniform, used when the arc flares.
5. **`Starfield`:** `Points` with about 3,000 stars, a twinkle shader, and parallax depth on scroll.
6. **`GoldenPlatter`:**
   - The platter is a `LatheGeometry` built from a 20-point profile.
   - Six props in a gold and smoked-glass style:
     - **Brand Bible:** a stack of 3 RoundedBox pages
     - **Research Lab:** a 5-bar chart
     - **Content calendar:** a 7×5 instanced tile grid
     - **Website:** a glass browser panel
     - **Funnel:** a lathe cone
     - **Bot:** a sphere with 2 rings
   - The 26 bots are an `InstancedMesh` whose orbits are animated in the shader.
   - Props appear through a dissolve shader.
   - The timeline is exposed as `platterTimeline` so P7 can tie it to scroll.
7. **`DuneTerrain`:** a plane displaced by simplex noise in the vertex shader, lit by a golden-hour sun with distance fog. Exposes `cameraGlide` progress.
8. **`GoldGlintPlane`:** an anisotropic streak shader for the package cards, with `hover` and `reveal` uniforms.
9. **`ScrollSequence`** (`components/motion/scroll-sequence.tsx`):
   - Props: `manifestUrl`, `variant` (desktop or mobile, chosen automatically).
   - Loads the frame manifest. Fetches every 10th frame first, then fills the gaps.
   - Decodes to `ImageBitmap`, keeping at most 120 decoded frames around the current position and evicting the rest.
   - Draws to a canvas with object-fit cover and a DPR cap.
   - Progress comes from `useScrollProgress`.
   - Overlays: film-grain (3–4%) and vignette.
   - Tier 0: renders the poster `<img>` only.
10. **`/lab/3d`:** shows each piece with a tier switcher and sliders for the brand values. Includes a "render poster" button that saves a WebP still of each scene to `public/posters/` (used for the static versions).

**Acceptance criteria**

- Each scene holds 60 fps on an M1-class laptop at tier 3, and the emblem alone holds ≥30 fps on an integrated-GPU laptop at tier 2. Phones are tier 1 (posters/video, no live WebGL).
- Under 60k triangles in total.
- No WebGL errors.
- Changing `nebula.glow` in the config re-colours the gas.
- Tier 0 shows the posters.

---

### P5: Media pipeline + booking, offers, events and webhooks (owner: Grok, Wave 3, about 4 days)

**Depends on:** P2.
**Nafew provides before start:**

- at least the hero loop clip (the full set can follow);
- the Discovery Call calendar with availability set in GHL;
- GHL custom values created: `price_*`, `value_*`, `turnaround_*`, `public_phone`, `offer_banner`;
- a GHL workflow "Offer changed → Custom Webhook" pointing to the staging URL with the shared secret.

**Files you own:** `scripts/media/**`, `app/api/v1/booking/**`, `app/api/v1/bookings/**`, `app/api/v1/offers/**`, `app/api/v1/events/**`, `app/api/webhooks/**`, `lib/ghl-read/**`, `worker/**` (extended), colocated `*.test.ts`.

**Tasks**

1. **`scripts/media`** (Bun scripts that call ffmpeg; the commands are in §8.6):
   - `extract-frames <clip> <chapter>`: desktop 1280w and mobile 720w WebP at 12 fps.
   - `make-poster <clip>`.
   - `make-loop <clip>`: all-intra WebM (VP9) + MP4 (H.264, faststart).
   - `manifest <chapter>`: `{chapter, fps, frames, desktop:[urls], mobile:[urls], poster, bytes}`.
   - `publish`: rsync `out/` to `VM:/srv/media/<hash>/`, then print the manifest URLs.
   - Budgets: each chapter ≤8 MB on desktop and ≤4 MB on mobile. The script fails if a budget is exceeded.
2. **`GET /api/v1/booking/slots?from&to&tz`:**
   - Reject ranges over 31 days.
   - Call `getFreeSlots`, cache it in memory for 60 s per (from, to, tz), and map the result to the contract shape.
3. **`POST /api/v1/bookings`** (synchronous):
   1. Validate and check ALTCHA and the idempotency key.
   2. Upsert the contact.
   3. Create the appointment (never use `ignoreFreeSlotValidation`).
   4. Return `201`. If the slot is taken, return `409 slot_taken`.
   5. On GHL 5xx, write to the outbox (`type: 'booking'`) and return `202`.
   6. Tag the contact `stage:call-booked` and move the opportunity to "Call Booked".
4. **`GET /api/v1/offers`:**
   - Reads custom values + products.
   - Caches with the tag `offers` and revalidates every 10 minutes (AGENTS.md § Caching: per-fetch `next: { revalidate, tags }`; `unstable_cache` only if the SDK does not use `fetch`).
   - Maps the data to the contract shape.
5. **`POST /api/v1/events`:**
   - Insert into `event_buffer`.
   - Worker job `ghl.events.flush` runs every 5 min. It groups events by email (when known), turns them into tags (`intent:pricing`, `intent:pkg-<tier>`, `intent:video`) plus the `intent_signals` field, and makes at most one GHL write per contact per flush.
   - Anonymous-only events are kept for 30 days, then deleted.
6. **`POST /api/webhooks/ghl-workflow/:key`:**
   - Compare `:key` to `GHL_WORKFLOW_SECRET` in constant time.
   - Dedupe on payload ID + timestamp in `webhook_receipts`.
   - Event "offer-changed" → `revalidateTag('offers')`.
   - Return `200` fast.
7. **Tests:**
   - the slot range limit;
   - booking 409;
   - booking idempotency;
   - event flush grouping;
   - webhook dedupe and bad key.

**Acceptance criteria**

- A test booking appears in the GHL calendar and the pipeline moves to "Call Booked".
- Booking the same slot again returns 409.
- Changing `price_founder` in GHL updates `/api/v1/offers` within 1 minute (via the webhook).
- The media scripts turn a 15 s clip into a manifest within budget.

---

### P6: Remaining pages + booking UI + content load (owner: Astra, Wave 3, about 4 days)

**Depends on:** P3, and P5 for real booking (use the mocks until then).
**Nafew provides before start:**

- How-it-works steps text (questionnaire → bots → peer review → revisions → handover).
- About: the Founder's story or timeline, co-founder bio, photos (or marked placeholders), and the approved experience figure.
- "Client zero" proof screenshots (HONEST's real Notion and GHL, with any private data blurred).
- Lead magnet "The HONEST Marketer": title, 3 bullets, cover image, and how it's delivered (a GHL workflow email).
- 10 FAQs (or approval to use the drafted ones).

**Files you own:** the same as P3.

**Tasks**

1. **`/how-it-works`:** 5 steps using a `ProcessSteps` standard section (a static numbered list; P7's animated arc is homepage-only), plus an FAQ block (category: process).
2. **`/about`:**
   - story timeline: a vertical list built from a CMS array;
   - two bio cards;
   - a "17 years combined" stat, only if approved (otherwise hidden).
3. **`/proof`:**
   - a "Client zero: HONEST Marketing itself" intro;
   - a screenshot gallery with captions (lightbox; keyboard accessible);
   - an attributed Research Lab data block;
   - **no invented testimonials**.
4. **`/the-honest-marketer`:**
   - landing page with the MagnetForm (`type: 'magnet'`);
   - success → `/thanks/magnet`, whose copy says delivery is by email.
5. **`/book`** (custom booking UI):
   - Month calendar of available days, from `/api/v1/booking/slots` (fetching the next 31 days, then paging).
   - The visitor's timezone is detected and can be changed.
   - A slot list.
   - Short form: name, email, optional phone, the Founder's qualifying questions from SiteSettings, and the consent UI.
   - Submit → `/thanks/booking`, with an ICS download and "Add to Google Calendar" links.
   - A 409 shows "Just taken, pick another time" and refreshes the slots.
   - If the API is down: fall back to the GHL calendar embed URL from SiteSettings.
6. **Package detail pages:** complete them with the deliverables, comparison and the Founder Package spotlight styling (using P7's `PackageReveal` component once merged; until then, a static grid).
7. **Content load:** enter all provided copy into the CMS. Mark anything unapproved with an "[DRAFT]" badge that shows only in preview mode.
8. **Analytics:** call `track()` at pricing view, package card click, CTA clicks and the booking steps.
9. **End-to-end tests:** booking happy path, booking 409, magnet signup, and axe on all new pages.

**Acceptance criteria**

- A booking made through `/book` appears in GHL.
- The pages reach Lighthouse ≥95 and pass axe.
- Every text comes from the CMS, with no hard-coded copy.

---

### P7: Signature homepage sections (owner: Claude, Wave 3, about 7 days)

**Depends on:** P1 and P4. P5's media scripts are needed for S2–S3.
**Nafew provides before start:**

- Clips from §8, already processed with P5's scripts:
  - hero loop (16:9 + 9:16)
  - chapters 1–3 (16:9 + 9:16)
  - platter backplate
  - molten-gold loop
- Homepage copy, approved or marked DRAFT.

**Files owned:** `components/sections/signature/**`, `app/(site)/page.tsx`, `components/motion/**`, `components/three/**`.

**Build order (each section is finished with its static version before the next one starts):**

1. **S1 Hero:**
   - The video loop (`<video muted playsinline loop>`, WebM/MP4, poster) sits under the `NebulaGas` overlay.
   - `Emblem3D` is centred right. The arc draws (0–1.2 s), the starburst flares (1.2–1.8 s), then the idle spin starts.
   - The headline keeps P1's CSS line rise on first paint (LCP-safe); `useSplitReveal` is for headlines below the fold. The CTAs rise in.
   - Scrolling past the hero pushes the emblem back and fades the video into S2.
2. **S4 Golden platter:**
   - A sticky stage (`250vh` wrapper).
   - `platterTimeline` is tied to scroll with `onScroll({ sync: true })`.
   - The deliverable labels are HTML captions that track the props' positions.
3. **S5 How it works:**
   - The `HorizonDivider` arc becomes the progress path (`createDrawable`, scroll-synced).
   - 5 steps light up gold in turn, from CMS content.
4. **S6 Package reveal** (`PackageReveal`, also used by Astra on `/packages`):
   - Cards rise with the `GoldGlintPlane` behind them.
   - The molten-gold loop is masked inside the card borders on hover.
   - Prices count up with a strikethrough animation on the value.
   - The Founder Package is highlighted.
   - The Layout module animates the reorder when a "compare" toggle is used.
   - Prices come from `/api/v1/offers`.
5. **S2 Scroll film:**
   - A sticky `ScrollSequence` across chapters 1–3 (`600vh` wrapper).
   - Captions pinned at the left, revealed per chapter at progress thresholds.
   - The chapter-3 ending hands off to S3's dune scene.
6. **S3 The turn:**
   - The `DuneTerrain` camera glide is tied to scroll.
   - The page background tweens from `--void` and the nebula colours to frontier light through CSS variables.
   - The headline "Not a marketing agency like was possible yesterday".
7. **S7 Proof → booking:**
   - Real screenshots pinned in a device frame, scrolling inside the frame.
   - A closing CTA band with a gold "Book your call" button linking to `/book`.
8. **Page polish:**
   - Section transitions: overlapping fades and the nebula light shift.
   - The nav goes transparent over the hero, then solid.
   - A scroll-progress hairline in gold.

**Acceptance criteria**

- Every section works at all 4 tiers.
- The homepage reaches Lighthouse mobile ≥90 at tier 1.
- CLS ≤0.1.
- All copy comes from the CMS.
- Reduced motion gives a complete, readable static story.

---

### P8: Hardening and ops (owner: Grok, Wave 4, about 3 days)

**Files you own:** `deploy/**`, `app/api/**` (middleware for rate limits), `worker/**`, colocated `*.test.ts`, `docs/ops/**`.

**Tasks**

1. **Rate limits**, per IP. Satus's `proxy.ts` already rate-limits `/api/*` in memory (`lib/utils/rate-limit.ts`). Make the limits below hold across restarts with a Postgres store; request `rate-limiter-flexible` in your PR if you need it:

   | Endpoint           | Limit        |
   | ------------------ | ------------ |
   | `/api/v1/leads`    | 10 / hour    |
   | `/api/v1/bookings` | 5 / hour     |
   | `/api/v1/events`   | 120 / minute |

   Over the limit returns `429` with the contract's error envelope.

2. **ALTCHA:** verify it server-side on every public POST (confirm none were missed). Replay protection: store spent challenges for 1 hour.
3. **Load test** (autocannon): 200 leads in 60 s → no 5xx errors, no duplicates, the worker drains in under 2 minutes with no 429 failures from GHL.
4. **Monitoring:**
   - Uptime Kuma checks `/`, `/api/health` and the worker heartbeat every 60 s, with email alerts to Nafew.
   - Docker log rotation (10 MB × 5).
5. **Security:**
   - Run as non-root containers.
   - `npm audit` / `bun audit` fixes.
   - Check headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) through Caddy.
   - Collaborate with Claude on the CSP (Claude owns the policy).
6. **Secrets:**
   - `docs/ops/secrets.md` with a PIT rotation runbook (90 days, with a 7-day overlap).
   - A calendar reminder script.
7. **Backups:** run a restore drill, write it up in `docs/ops/restore.md`, and test the weekly media archive.
8. **DLQ tooling:** `bun run dlq:list`, `bun run dlq:retry <id>`.

**Acceptance criteria**

- The load-test report is committed.
- The restore drill is documented.
- Uptime Kuma is alerting.
- The rate limits are proven by tests.

---

### P9: QA, accessibility, SEO audits (owner: Astra, Wave 4, about 3 days)

**Files you own:** `e2e/**`, `.github/workflows/**`, `docs/qa/**`, plus your own page and form files for fixes.

**Tasks**

1. **Cross-browser:** Playwright matrix of Chromium, WebKit and Firefox, plus iPhone 15 and Pixel 8 emulation. Every route renders, and the forms and booking work.
2. **Accessibility:**
   - axe with zero serious or critical issues.
   - A keyboard-only walkthrough of every page.
   - Focus is visible everywhere.
   - VoiceOver and NVDA spot checks on the home, packages, book and contact pages.
   - Colour contrast verified from the tokens.
3. **SEO:**
   - titles and descriptions are unique;
   - canonicals;
   - OG images render;
   - JSON-LD validates (schema.org validator);
   - the sitemap includes every public route;
   - `/lab` is noindex.
4. **Performance:** Lighthouse CI on the 10 key routes. Write a report of any route under budget, with the cause.
5. **Links:** `linkinator` across the site, with zero broken links.
6. **Fixes:** fix the issues in your own folders. File issues for others in `docs/qa/issues.md` (owner, route, steps, expected result).

**Acceptance criteria:** `docs/qa/report.md` with results, all P0 issues closed or assigned.

---

### P10: Performance, polish, launch readiness (owner: Claude, Wave 4, about 3 days)

**Tasks**

1. Fix every issue assigned to Claude in `docs/qa/issues.md`.
2. **Real-device pass** (iPhone Safari, mid-range Android, MacBook, Windows): frame times, memory (cap the ScrollSequence window if needed), and any jank in the scroll film.
3. **Asset budgets:** re-encode or trim any frame sets over budget; check the posters are the LCP elements on every tier.
4. **Final CSP:** self, `/media`, the GHL tracking script and API origins used by the client side (if any), ALTCHA, and fonts (self-hosted). It must have **no `unsafe-inline` scripts**; inline scripts use nonces.
5. **Final review** of every merged PR against the Common Rules; make sure no hex values or GSAP slipped in.
6. **Production cut-over:**
   - Run `deploy.sh` to production together with Grok's runbook.
   - Smoke test.
   - Tag `v1.0.0`.

**Acceptance criteria**

- The QA script in §9 passes in production.
- Core Web Vitals: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 on mobile for `/`.

---

## 5. Back-end reference (used by P1, P2, P5)

### 5.1 API contract (P1 writes it; all other phases follow it)

| Endpoint                                                          | Request                                                                                                                                                                                                                                                                                                                          | Response                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST /api/v1/leads`                                              | `{type: 'contact'\|'magnet'\|'package'\|'gift', firstName, lastName?, email, phone?, company?, website?, message?, packageInterest?: Tier, consent: {email: boolean, sms: boolean, smsText: string, emailText: string}, utm: {source?, medium?, campaign?, content?, term?}, pageUrl, altcha: string}`, header `Idempotency-Key` | `202 {status:'queued', ref}` / `400` / `409` / `429`                                            |
| `GET /api/v1/booking/slots?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=IANA` | —                                                                                                                                                                                                                                                                                                                                | `{tz, days: [{date, slots: [ISO8601]}]}`                                                        |
| `POST /api/v1/bookings`                                           | `{slot: ISO8601, tz, contact: {firstName, lastName?, email, phone?}, answers: Record<string,string>, consent: {...}, altcha}`, header `Idempotency-Key`                                                                                                                                                                          | `201 {appointmentId, start, end}` / `202 {status:'queued'}` / `409 {error:{code:'slot_taken'}}` |
| `POST /api/v1/events`                                             | `{anonId, email?, events: [{name: 'pricing_viewed'\|'package_clicked'\|'cta_clicked'\|'video_completed', props?: object, ts: ISO8601}]}`                                                                                                                                                                                         | `204`                                                                                           |
| `GET /api/v1/offers`                                              | —                                                                                                                                                                                                                                                                                                                                | `{packages: [{tier, price, value, turnaround}], phone?, banner?}`                               |
| `POST /api/webhooks/ghl-workflow/:key`                            | GHL workflow payload `{event, id, ...}`                                                                                                                                                                                                                                                                                          | `200`                                                                                           |

The error envelope is `{error: {code, message, fields?: Record<string,string>}}`.

### 5.2 GoHighLevel is the system of record

Our Postgres keeps only the CMS content, the outbox, the consent log, webhook receipts and the event buffer. Contacts, opportunities and appointments live in GHL.

### 5.3 GHL setup (Nafew, before P2; P2's script creates the fields)

- **Private Integration Token** from **HONEST's sub-account**, with these scopes:
  - contacts.readonly / contacts.write
  - opportunities.readonly / opportunities.write
  - calendars.readonly
  - calendars/events.write
  - locations/customValues.readonly
  - locations/customFields.readonly / .write
  - locations/tags.write
  - products.readonly

  It is stored only in the VM's `.env`.

- **Pipeline** "Website Leads": New → Contacted → Call Booked → Proposal → Won / Lost.
- **Calendar** "Discovery Call": 30 min, 15 min buffer, availability set.
- **Custom fields:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `landing_page`, `package_interest`, `lead_type`, `sms_consent_text`, `sms_consent_at`, `intent_signals`.
- **Tags:** `src:website`, `lead:contact|magnet|package|gift`, `pkg:basic-diy|executive|founder|diamond`, `stage:call-booked`, `intent:pricing|video|pkg-<tier>`.
- **Custom values:** `price_basic`, `price_executive`, `price_founder`, `price_diamond`, `value_*`, `turnaround_*`, `public_phone`, `offer_banner`.
- **Workflows:**
  - New website lead → notify + nurture.
  - Booking → confirmation.
  - Magnet → deliver the eBook.
  - Custom value changed → Custom Webhook to `/api/webhooks/ghl-workflow/<secret>` (event `offer-changed`).
- **SMS** stays off until A2P (US business texting) registration is approved.

---

## 6. Your asset and input schedule (Nafew)

| Before                       | You provide                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1** (Day 1)               | GitHub repo; gold approval (done)                                                                                                                                                                           |
| **P2 / P3 / P4** (Day 3)     | GHL setup (§5.3) + PIT + IDs; VM with SSH + staging hostname; package facts; legal drafts; consent text; contact email                                                                                      |
| **During Wave 2** (Days 4–9) | **Hero style frame** → **hero loop** (§8, Shot 1), then **Chapter 1** → **Chapter 2** → **Chapter 3** (each one starts from the previous clip's last frame), then **platter backplate** and **molten gold** |
| **P5** (Day 10)              | At least the hero loop; GHL calendar availability; custom values; the offer-changed workflow                                                                                                                |
| **P6** (Day 10)              | How-it-works text, about content and photos, proof screenshots, lead-magnet details, FAQs                                                                                                                   |
| **P7** (Day 10)              | All clips, processed by `scripts/media`; homepage copy                                                                                                                                                      |
| **Launch**                   | Founder's final sign-off; DNS A record for hnst.marketing pointing to the VM; A2P registration after the legal pages are live                                                                               |

Missing copy never blocks code: every phase uses CMS placeholders marked "[DRAFT]".

---

## 7. Timeline

| Days  | Claude | Astra | Grok | Milestone                                       |
| ----- | ------ | ----- | ---- | ----------------------------------------------- |
| 1–3   | P1     | —     | —    | Skeleton + contracts frozen                     |
| 4–9   | P4     | P3    | P2   | **v0 on staging**: forms → GHL, packages, legal |
| 10–17 | P7     | P6    | P5   | Full site on staging, with booking              |
| 18–22 | P10    | P9    | P8   | **v1 launch-ready**                             |

---

## 8. Grok Imagine video prompts (paste-ready, with the purple nebula gas)

### 8.1 How to generate

- **Where:** Grok Bot (ask HONEST Producer to use `GenerateVideo`) or grok.com Imagine. Use the highest resolution offered.
- **Always image-to-video:**
  1. Generate the style frame image.
  2. Approve it.
  3. Animate it.
- **Chapters chain:** the last frame of each clip becomes the first frame of the next. Extract it with `ffmpeg -sseof -0.05 -i ch1.mp4 -frames:v 1 ch1_last.png`.
- **Loops:** use the same image as the first and last frame.
- **Variants and formats:** set the duration explicitly and make 3–4 variants per shot. Make 16:9 first, then 9:16 with the mobile line (§8.4).

### 8.2 Style anchor (paste at the start of every prompt)

> Premium cinematic brand film, luxury CGI with photoreal materials, anamorphic 35mm lens look, extremely slow and smooth camera movement, one continuous shot with no cuts. Colour world: an ink-black void (#0e0e14) filled with an endless, softly glowing violet-purple nebula gas, like an infinite cosmic cloud: luminous lavender-violet cores (#8b6fc0), dusky purple haze (#5a4a67), deep plum shadows (#2a1f3d), and faint lavender rim light (#b8a4e3). The only other strong colour is warm champagne-gold metallic light (#c1b38d), with occasional deeper desert-gold (#b78f65). Calm, powerful, awe-inspiring, minimal. High dynamic range, deep blacks, gentle film grain, volumetric light through the gas, shallow depth of field, crisp detail. Absolutely no text, letters, numbers, logos, symbols, watermarks, user interfaces, people or faces. No flashes, no strobing, no sudden colour shifts.

### 8.3 Shots

**Shot 1: HERO LOOP "The Rising Arc"** (10 s, seamless loop)

- _Style frame:_ `[ANCHOR] A vast dark planet seen from orbit fills the bottom-right of the frame, its curved horizon traced by a razor-thin line of champagne-gold light. Above it, billowing violet-purple nebula gas glows from within, layered clouds of lavender light and plum shadow stretching into infinity, sparse tiny stars. The left 40% of the frame is darker and calmer (space for headline text). Wide shot, slight low angle, still.`
- _Video:_ `[ANCHOR] Starting from the provided image. 0–3 s: the camera drifts forward extremely slowly; the purple nebula gas swirls gently, its glowing cores breathing in brightness; the gold rim light brightens softly. 3–7 s: a champagne-gold glow rises just above the horizon like a sunrise from orbit and blooms into a delicate starburst with long thin rays; the gold light shines through the purple gas, lighting its edges; fine golden dust drifts. 7–10 s: the glow settles back to a thin rim line and the gas returns to its opening shape, ending exactly on the opening frame for a seamless loop. Keep the left 40% calm and dark.` Use the style frame as both the first and the last frame.

**Shot 2: CHAPTER 1 "Back in my day: the overwhelm"** (15 s)

- _Style frame:_ `[ANCHOR, but colder] Hundreds of blank paper cards, sticky notes, tangled cables and dim blank glass panels float chaotically inside a dark grey-violet fog; cold grey-blue light; a few tiny orange notification dots blink. Busy, cluttered, slightly claustrophobic. No writing anywhere.`
- _Video:_ `[ANCHOR, colder] Starting from the provided image. 0–6 s: slow dolly forward through the drifting clutter in zero gravity; items tumble and softly collide. 6–11 s: the clutter thickens, the cold fog churns, faint restless flicker (no strobing). 11–15 s: far ahead, a warm champagne-gold glow appears inside a pocket of luminous violet gas and grows, warming the nearest cards. End with the gold-and-violet glow centred.`

**Shot 3: CHAPTER 2 "Super Intelligence arrives"** (15 s; the first frame is Shot 2's last frame)

- _Video:_ `[ANCHOR] Starting from the provided image. 0–5 s: the gold glow opens into a slow vortex of violet-purple nebula gas; the floating cards and cables dissolve into tiny golden particles that stream into the vortex. 5–11 s: the particles organise into a calm constellation of about twenty-six bright gold nodes linked by thin glowing filaments, orbiting a soft sphere of champagne light, wrapped in glowing purple gas. 11–15 s: the constellation turns slowly into perfect symmetry; the gas settles into soft luminous layers. Order from chaos, serene and intelligent.`

**Shot 4: CHAPTER 3 "The Frontier"** (15 s; the first frame is Shot 3's last frame)

- _Video:_ `[ANCHOR, warming to golden hour] Starting from the provided image. 0–5 s: the camera descends past the constellation, which fades into stars, through thinning veils of purple nebula gas. 5–11 s: the gas parts to reveal a vast desert of sculpted dunes at golden hour, warm desert-gold sand with long soft shadows and a single faint trail toward the horizon; a last whisper of violet haze high in the sky. 11–15 s: on the horizon a low golden sun forms a thin rising arc of light; the camera glides forward along the trail. Pioneering, hopeful, epic but quiet. No buildings, people or animals.`

**Shot 5: "Golden Platter" backplate** (10 s, seamless loop)

- _Style frame:_ `[ANCHOR] Macro close-up of a polished champagne-gold circular surface on deep black velvet in a dark studio, with soft violet-purple gas drifting low in the background; studio light reflections across the metal; floating golden dust; very shallow depth of field.`
- _Video:_ `[ANCHOR] Starting from the provided image. A very slow 20-degree orbit; a soft band of light sweeps across the gold reflections; the purple gas drifts; at 6–8 s a warm bloom rises from the centre, then fades, returning exactly to the opening frame.` Use the style frame as both the first and the last frame.

**Shot 6: "Molten Gold" loop** (10 s, seamless loop)

- _Style frame:_ `[ANCHOR] Extreme close-up of molten champagne gold flowing in slow motion over black glass, smooth glossy ripples, highlights glinting, faint violet reflections from purple gas above, deep black space around.`
- _Video:_ `[ANCHOR] Starting from the provided image. Liquid gold flows and folds in slow motion, ripples spreading gracefully, light glinting along the crests, faint violet reflections shifting; continuous motion returning to the opening state at 10 s for a seamless loop. No splashes, no sparks.` Use the style frame as both the first and the last frame.

### 8.4 Mobile 9:16 add-on

> Vertical 9:16 composition. Keep the main subject in the centre third and the top 30% of the frame calm and dark for headline text.

### 8.5 Pick-the-best checklist (reject the clip if any item fails)

- [ ] No text, logos, symbols or faces anywhere (zoom in)
- [ ] No flicker, strobing or "boiling" textures; no sudden colour shifts
- [ ] Objects don't melt or morph (except the intended dissolves)
- [ ] Smooth camera, one continuous shot
- [ ] Palette is ink-black, glowing purple gas and champagne gold; no green or cyan casts
- [ ] Headline area is calm (left 40% on desktop, top 30% on mobile)
- [ ] Loops: the last frame matches the first; chapters: the first frame matches the previous clip's last frame

### 8.6 ffmpeg (implemented by P5 `scripts/media`)

```bash
# Scroll-film frames: 12 fps WebP, desktop 1280w + mobile 720w
ffmpeg -i ch1.mp4 -vf "fps=12,scale=1280:-2:flags=lanczos,unsharp=5:5:0.4" -c:v libwebp -quality 72 -compression_level 6 out/ch1/d_%04d.webp
ffmpeg -i ch1_9x16.mp4 -vf "fps=12,scale=720:-2:flags=lanczos" -c:v libwebp -quality 70 out/ch1/m_%04d.webp
# Poster (LCP image)
ffmpeg -i ch1.mp4 -frames:v 1 -vf "scale=1600:-2" -c:v libwebp -quality 80 out/ch1/poster.webp
# Seamless loops as all-intra video (scrub-safe): WebM first, MP4 fallback
ffmpeg -i hero.mp4 -vf "scale=1280:-2" -c:v libvpx-vp9 -g 1 -b:v 0 -crf 34 -an out/hero.webm
ffmpeg -i hero.mp4 -vf "scale=1280:-2" -c:v libx264 -g 1 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -an out/hero.mp4
```

**Hiding Grok Imagine's softer quality:** display video at most 1280 px wide, overlay 3–4% film grain and a vignette, fade the edges into the nebula shader, and let the 3D emblem and HTML typography carry the sharp detail.

---

## 9. Launch QA script (Nafew, after P10)

1. **Devices:** iPhone Safari, mid-range Android Chrome, MacBook Safari and Chrome, Windows Edge. Scroll the whole homepage on each: it should be smooth, with no blank frames and no crashes.
2. **Reduced motion on:** you get the full static story, and everything is readable.
3. **Forms:** submit contact, magnet and package forms, then check GHL has 1 contact each with the right tags, UTMs, consent fields and pipeline stage. Submit one twice and confirm there's still 1 contact.
4. **Booking:** book a slot and check it's in GHL. Book the same slot again and confirm you get the "just taken" message.
5. **Prices:** change `price_founder` in GHL and check the site updates within 1 minute.
6. **Legal:** Privacy, Terms, SMS terms and package T&Cs are live. The footer shows the legal entity and address.
7. **Performance:** Lighthouse mobile ≥90 on `/` and ≥95 on other pages.
8. **Content:** check it against the Tone guide. No invented proof. Write "Founder Package", not just "Founder".
9. **Go live:** the Founder says go → switch DNS → re-run steps 3–5 on production.

---

## 10. Licence summary (everything is free)

| Licence                 | Components                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIT                     | Satus, Next.js, React, Tailwind, Payload, anime.js, Lenis, Three.js, R3F, drei, detect-gpu, pg-boss, node-pg-migrate, bottleneck, zod, msw, react-hook-form, ALTCHA, vanilla-cookieconsent, Uptime Kuma, autocannon, linkinator, Playwright (Apache-2.0) |
| ISC                     | rate-limiter-flexible                                                                                                                                                                                                                                    |
| Apache-2.0              | Caddy                                                                                                                                                                                                                                                    |
| PostgreSQL licence      | PostgreSQL                                                                                                                                                                                                                                               |
| Open Font License (OFL) | Bodoni Moda, Inter, Archivo Narrow                                                                                                                                                                                                                       |

**Paid services (already owned):** GoHighLevel and the Grok plan (for Imagine). **CI:** GitHub Actions free tier, used for checks only; a self-hosted Gitea + Woodpecker can replace it later if you want everything on the VM.
