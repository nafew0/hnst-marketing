# Signature homepage sections (P7)

The homepage story, S1–S7, composed in `home-sections.tsx`. `app/(site)/page.tsx` renders it and stays statically prerendered (○ in `bun run build`), so nothing here may read cookies, headers or the CMS at request time. `/lab/home?tier=0…3` shows it under a forced device tier.

| Section            | Folder                              | Tiers 2–3                                                                                                                              | Tier 1 (phones, weak GPUs)                                                    | Tier 0 (reduced motion, Save-Data)    |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| S1 Hero            | `hero/`                             | Live gas, stars and planet behind the real logo (faux-3D in CSS). Hover parts the stars and turns the logo; a click scatters the stars | Rendered poster, per layout; the logo still tilts and a tap sends a gold ring | Poster, no scroll fade                |
| S2 Scroll film     | `scroll-film/`                      | Frames scrubbed by scroll, captions at the left                                                                                        | The same                                                                      | Three stills with their text          |
| S3 The turn        | `the-turn/`                         | Pinned live dunes, camera and palette on scroll                                                                                        | Poster, palette on scroll                                                     | Poster at the end state               |
| S4 Golden platter  | `golden-platter/`                   | Pinned, `platterTimeline` on scroll, list items follow the props                                                                       | Poster and the list (desktop width stays pinned)                              | Poster and the list, not pinned       |
| S5 How it works    | `how-it-works/`                     | The arc draws with scroll, lights the steps and the logo rises from the horizon                                                        | The same (a straight rail under 800 px)                                       | All steps lit, nothing pinned         |
| S6 Package reveal  | `packages/`, `package-reveal/`      | Cards rise over molten `GoldGlintPlane`; streak follows the pointer                                                                    | Rise and count over the rendered gold                                         | Final numbers, nothing moves          |
| S7 Proof → booking | `proof-booking/`                    | Screens scroll inside a pinned device frame; gold "Book your call"                                                                     | The same on desktop; a stacked gallery on phones                              | Stacked gallery                       |
| Polish             | `scroll-hairline/`, `layout/header` | Gold progress hairline; the nav goes solid past the hero                                                                               | The same                                                                      | No hairline; the nav still goes solid |

## `PackageReveal` (for `/packages`)

```tsx
import { PackageReveal } from '@/components/sections/signature/package-reveal'

<PackageReveal items={items} />
```

`items` are `PackageRevealItem`s (`copy.ts`): name, summary, fallback `price`, optional `value` and `priceFrom`, `turnaround`, `href`, `ctaLabel`, `highlight` and `compare` rows. Map them from the CMS `Packages` collection and pass them from a Server Component. The component fetches `GET /api/v1/offers` itself once it nears the viewport and overlays live price, value and turnaround; on a 503 or a missing tier it keeps what you passed, as the contract asks. `compareToggle={false}` hides the compare button. Keep the disclosure line (tool costs) on the page around it.

## Copy

Everything is in `copy.ts`, typed, and **unapproved**. The wording is `HonestMarketing AI/HONEST-Website-Wave3-Inputs.md` § 2, and several lines depend on the open Founder decisions in § 1. `copyStatus: 'draft'` shows a small fixed "Draft copy" label on every environment until the text is signed off. Open facts read "To be confirmed". S5's steps are a typed fallback (`fallbackSteps`) that `<HowItWorks steps={…}>` replaces once P3's CMS is merged.

S7's screens are marked sample mock-ups (`components/sections/standard/stand-ins.ts`) until Nafew supplies real client-zero screenshots: add `image` to an entry in `proofShots` and the slate becomes the screenshot. No results or testimonials are invented.

## Writing a section

- **Static first.** Server-rendered HTML with the final state; motion upgrades it. Never hide text until JavaScript arrives.
- **Same length at every tier.** Pinned tracks are set in CSS (`--desktop` and `--motion-ok`), not from the tier, so the page doesn't jump when detection finishes.
- **No three.js in the first load.** Load a section's scene with `useLazyWorld` and a module-level `import()`; pass `enabled={World !== null}` so the poster stays until the scene can draw.
- **3D sections stay transparent.** The canvas is behind the page. `overflow` and `border-radius` can't clip it: mask in the shader, as `GoldGlintPlane`'s `corner` does.
- **Pinned scenes need `pinTrack`.** hamo measures a sticky element where it would sit unpinned, so `ViewportScene` gets the track's rect.
- **Scroll writes to refs,** never state. `useScrollProgress` is the only scroll source here.

## Regenerating the pictures

`/lab/posters` (development, on a real GPU): **Render all** re-renders each section's poster at the aspect it is shown, and **Render film** the 72 frames per layout, the manifest and the three stills. Run them after changing a scene. Next's image cache can serve an old poster in `bun dev`; delete `.next/dev/cache/images` to see the new one.
