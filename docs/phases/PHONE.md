# Phone layout (M1–M9): the shared brief

The iPhone-style layout under the `dt:` breakpoint, decided by Nafew on 6 Nov 2026 at the Founder's request. Every M brief (`M1.md`–`M9.md`) builds on this file. The design and its reasons are in the workspace's `HONEST-Mobile-iOS-Plan.md`, outside this public repo.

## TL;DR

- **Nine phases, M1–M9.** "M" stands for mobile; the original P1–P10 numbering is unchanged.
- **Claude does most of it, because it's mostly design:**

  | Coder  | Phases             | Rough days |
  | ------ | ------------------ | ---------- |
  | Claude | M1, M2, M5, M7, M9 | 19         |
  | Astra  | M3, M6, M8         | 10         |
  | Grok   | M4                 | 3          |

- **About 21 working days end to end** (roughly 4½ weeks). It's a rough estimate. Grok and Astra work alongside Claude where the dependencies allow, and wait where they don't.
- **Desktop doesn't change.** From 800 px up, the macOS windows and dock stay exactly as they are.
- **One branch per coder** (Nafew, 6 Nov): `claude/mobile`, `astra/mobile` and `grok/mobile`. Each opens a PR into `main` at its handoff points (§ 2), then keeps working on the same branch after merging `main` back in.
- **No real phones** (Nafew, 6 Nov). Testing happens in browsers at phone sizes: the built-in browser at a phone aspect ratio, plus Playwright's WebKit and Chromium mobile emulation. The report never claims a real-device pass.
- **Not tested in these phases: mobile LCP** (Nafew, 6 Nov).

## 1. Decisions these phases build (6 Nov 2026)

- **The split:** phones are under the `dt:` breakpoint (800 px) and get the iPhone layout. Computers keep macOS. It's the same site at the same URLs.
- **Lock screen:** shown on the first visit, with iOS-style notifications. Banners and a Notification Centre follow while browsing. No real push notifications.
- **Home screen:**
  - widgets: Next free call, and Add to Home Screen;
  - a 12-icon grid: HONEST, Calendar, Camera, Packages, How it works, About, The HONEST Marketer, Instagram, X, YouTube, TikTok, LinkedIn;
  - a dock: Photos, the classic website, Notes, Mail.
- **Packages** is App Store style, with no ratings.
- **The classic website** (the reference calls it Safari) opens today's mobile site.
- **The photo wall is public and moderated.** Photos are re-encoded without location data, posting is 18+, and nothing shows until an editor approves it.
- **Mail and Notes** send through the existing `contact` lead. A visitor's own notes stay on their phone unless they send them.
- **No fake status bar.** The look and icons are ours: no Apple artwork, fonts or wallpaper.
- **Copy** is the Founder's to write or approve. Social icons stay hidden until their handles exist.

## 2. Waves and timeline (working days, rough)

| Wave | Days  | Claude                                     | Astra                                                          | Grok                            |
| ---- | ----- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------- |
| A    | 1–3   | **M1** foundation, spike, contract         | waits                                                          | waits                           |
| B    | 4–8   | **M2** shell and notifications             | **M3** CMS (days 4–6), with `wallPhotos` first, on day 4       | **M4** wall back end (days 4–7) |
| C    | 9–14  | **M5** design apps                         | **M6** Calendar, Mail, Notes (days 9–12), then starts M8 tests | done; fixes only                |
| D    | 15–17 | **M7** Camera and wall                     | **M8** tests on finished apps                                  | —                               |
| E    | 18–21 | QA fixes (days 18–19), then **M9** release | **M8** final run (days 18–19)                                  | —                               |

**Gates:**

- Nothing starts until M1's spike report is accepted.
- M4 can only store photos once M3's `wallPhotos` collection exists, which is why Astra builds that first.
- M6 needs M2's phone primitives.
- M7 needs M5's Photos app. It builds against MSW mocks, then checks against M4's real endpoint.

**Branches and merge points.** There is one branch per coder: `claude/mobile`, `astra/mobile` and `grok/mobile`. A PR into `main` opens at each handoff below. After it merges, the coder merges `main` back into their branch and carries on.

| Merge into `main`                                      | Unblocks                                          |
| ------------------------------------------------------ | ------------------------------------------------- |
| `claude/mobile` after M1                               | M3 and M4 start from `main`                       |
| `astra/mobile` after M3 step 1 (`wallPhotos`)          | Grok merges `main` and wires M4 to the collection |
| `claude/mobile` after M2                               | M6 (phone primitives)                             |
| `grok/mobile` after M4, `astra/mobile` after M3 and M6 | M7's real-endpoint check, M8's final run          |
| `claude/mobile` after M5 and M7, then after M9         | M8's final run, then release                      |

## 3. Phone rules (paste after `docs/RULES.md`, before each M brief)

```text
PHONE LAYOUT (decided 6 Nov 2026; design in HONEST-Mobile-iOS-Plan.md). Do not change a decision; if something blocks you, ask in the PR description.
SPLIT: phones are under the dt: breakpoint (800 px). At 800 px and wider nothing changes, and e2e/windows.e2e.ts must stay green.
LOOK: iPhone-style, not Apple's. No Apple icons, artwork, SF fonts or wallpapers. Our own icons; colours and fonts only from brand.config.ts. Dock icons have no visible labels (as on iOS). The browser app's icon is ours (no compass), and its accessible name is "Classic website". Packages is never called "App Store".
APPS: every app is listed in components/ui/phone/registry.ts (Claude). Build yours in components/apps/<id>/ with the phone primitives in components/ui/phone/. Don't restyle the shell; ask Claude for a missing primitive.
URLS: content apps keep their real URL and their complete server-rendered page (no-JS, crawlers). Phone-only apps open with ?app=<id>, are noindex and stay out of the sitemap.
NOTIFICATIONS: only through notify(trigger, vars). Copy comes from site settings. Never invent messages, mentions, scarcity, ratings or reviews.
VISITOR INPUT: form drafts, notes and photos live in memory only. Never in localStorage, sessionStorage, IndexedDB or cookies. The only flags allowed in storage hold no visitor input: "lock screen seen" and "classic view on".
WALL: wall photos are visitors' photos. They are never proof, testimonials or client work. Nothing is public until an editor approves it.
CAMERA: starts only on a tap; stops on leaving the app, going home or hiding the tab.
GESTURES: every gesture also has a button. Swipes start away from the screen edges, which iOS and Android own.
MOTION: tier 0 and reduced motion get no wallpaper video, no zoom and no sliding, and everything still works.
BRANCH: one per coder for all mobile phases: claude/mobile, astra/mobile, grok/mobile. PR into main at each handoff; afterwards merge main back in and keep going. This replaces RULES.md's one-branch-per-phase pattern for M phases.
DEVICES: no real phones. Test at phone sizes in the browser (a phone aspect ratio in the built-in browser, Playwright WebKit and Chromium mobile emulation). Never claim a real-device pass.
NOT TESTED HERE: mobile LCP (Nafew, 6 Nov).
```

## 4. Who owns which files

| Path                                                                                           | Owner  |
| ---------------------------------------------------------------------------------------------- | ------ |
| `components/ui/phone/**` (shell, registry, primitives, notifications), `app/(site)/lab/phone/` | Claude |
| `components/ui/window/**` (the phone skin), `app/(site)/page.tsx`, `app/(site)/layout.tsx`     | Claude |
| `components/apps/{honest,packages,how-it-works,about,marketer,photos,browser,camera,wall}/**`  | Claude |
| `components/apps/{calendar,mail,notes}/**`, `app/(site)/wall/remove/`                          | Astra  |
| `lib/contracts/wall.ts`, `openapi.json`, the wall mocks                                        | Claude |
| `next.config.ts`, `lib/env.ts`, `.env.example`, `brand.config.ts`, `CODEOWNERS`, `docs/**`     | Claude |
| `deploy/native/**` (release prep in M9)                                                        | Claude |
| `lib/cms/**`: `wallPhotos`, `phoneNotes`, phone fields in site settings, migrations, seed      | Astra  |
| `e2e/phone-shell.e2e.ts` (the shell's own spec, M1–M2)                                         | Claude |
| `e2e/phone-*.e2e.ts` (the rest), `docs/qa/phone.md`                                            | Astra  |
| `app/api/v1/wall/**`, `lib/wall/**` (server only), `worker/jobs/wall-*.ts`                     | Grok   |

Apps may _use_ other owners' code without editing it. The Calendar uses `components/forms/booking-form.tsx` and `booking-utils.ts`. Packages and The HONEST Marketer reuse Astra's lead and magnet forms inside a sheet. The post sheet reuses `components/forms/captcha.tsx` and `consent-fields.tsx`.

## 6. Inputs from Nafew and the Founder

| Input                                                                         | Needed by                                    | Used in                    |
| ----------------------------------------------------------------------------- | -------------------------------------------- | -------------------------- |
| Handles for Instagram, X, YouTube, TikTok and LinkedIn                        | End of M5                                    | M2, M5 (hidden until then) |
| Copy: notifications, widgets, camera frame                                    | Before M8                                    | M3 (drafts until then)     |
| Wall consent text, wall rules, privacy-policy wall section (Founder approval) | Before M9 release                            | M3, M7                     |
| A named wall moderator, and how often they check                              | Before M9 release                            | M9                         |
| The real eBook cover and delivery email                                       | Before the eBook notification is switched on | M5, M3                     |

## 7. Where P8–P10 fit

- **No P8–P10 work is on `main` yet** (checked 6 Nov).
- **Run M1–M9 first,** so that P9 (QA) and P10 (polish) cover the phone layout as part of the whole site.
- **If P8 lands earlier,** M4 uses its rate limiter instead of its own.

## 8. Not in scope

- Real push notifications.
- Changes to the desktop layout, such as adding Camera or Notes to the macOS dock.
- A native app or an App Store listing.
- Face detection or recognition.
- Public visitor notes.
- A moderator email digest. It can come later.
- Client websites as tabs in the classic-website app.
- Mobile LCP testing.
