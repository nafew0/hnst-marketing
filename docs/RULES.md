# Common Rules (paste before every phase brief)

```text
PROJECT: hnst-web, the HONEST Marketing website (hnst.marketing), forked from darkroomengineering/satus: Next.js 16, React 19.3 with the React Compiler, TypeScript 7 strict, Tailwind v4, Bun. Before coding, read AGENTS.md (binding engineering rules), docs/PLAN.md § "Satus adaptations" (overrides anything older) and your phase brief in docs/phases/. Do not change any decision; if something blocks you, stop and write the question in your PR description.

OWNERSHIP: Edit only the files listed under "Files you own" in your phase (CODEOWNERS mirrors it). Shared files belong to Claude: package.json, bun.lock, tsconfig.json, next.config.ts, proxy.ts, brand.config.ts, lib/env.ts, .env.example, lib/navigation.ts, lib/contracts/**, lib/styles/**, components/ui/**, components/layout/**, CODEOWNERS, AGENTS.md, docs/** (except docs/qa/** and docs/ops/**). Request changes to them in your PR description.

CONTRACTS: lib/contracts is the source of truth for every /api/v1 request and response. Never edit it. The front end calls api.* from lib/contracts/client.ts; with NEXT_PUBLIC_API_MOCKS=1 the MSW mocks answer. The back end parses every request with the contract schemas and answers errors with { error: { code, message, fields? } }.

COLOURS/FONTS: never type a hex colour or a font name. Use Tailwind palette classes (bg-gold, text-starlight, bg-nebula-deep), CSS variables (var(--color-gold)) or import { brand } from '@/brand.config'. `bun run check:colors` fails on hex.

ANIMATION: anime.js 4.5 only (no GSAP, no framer-motion), loaded lazily. Use the components/motion hooks; respect usePreferredReducedMotion() and useDeviceTier(). Animate transform and opacity only. Never hide server-rendered above-the-fold text while waiting for JavaScript.

QUALITY GATE: `bun run check` must pass (oxlint, oxfmt, types, bun test, colours, contracts, contrast, lint-disable counts). Never add a lint-disable comment, @ts-ignore or @ts-expect-error: fix the code. Node >= 24.20 (`nvm use`), Bun 1.4.4.

BRANCH: <coder>/<phase>-<feature> (e.g. grok/p2-leads-api). PR into main. Small commits with conventional messages (feat:, fix:, docs:, chore:, refactor:); the commit-msg hook enforces them.

DONE MEANS: `bun run check` passes; your phase's acceptance criteria are demonstrably met (write how you verified them in the PR); no console errors; no secrets in code or client bundles; docs updated for anything you added.

NEVER: add dependencies without listing them in the PR for approval; delete others' files; commit secrets or plain .env files; call GoHighLevel from the browser; put a secret in a NEXT_PUBLIC_ variable; contact real clients or prospects from test code.
```
