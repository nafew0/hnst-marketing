# Motion core

anime.js 4.5 helpers and device tiers, from Phase 1. Lenis, Tempus and the anime.js bridge are already wired by Satus's `<Wrapper>` (`components/layout/lenis`), so there is no provider to add.

| Export                                  | Use                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDeviceTier()`                       | `{ state, meta }`. `state` is `undefined` until detection finishes (always on the server), so render the static version until then. Flags: `tier`, `reason`, `motionMedia`, `liveWebGL`, `bloom`, `maxDpr`. Rules and the full table are in `device-tier-rules.ts`. |
| `useSplitReveal(ref, { onScroll })`     | `splitText` by lines; each line rises out of a clip mask. For headlines below the fold. Above the fold, use a CSS entrance so LCP never waits for JS (see `components/sections/signature/hero`).                                                                    |
| `useDrawPath(svgRef, { scrub })`        | Draws every `[data-draw]` stroke inside the SVG (`svg.createDrawable`), once on entry or scrubbed by scroll. `<HorizonDivider>` is ready for it.                                                                                                                    |
| `useScrollLinked(ref, () => params)`    | `animate(el, params)` synced to scroll with `onScroll({ sync })`. Animate `transform` and `opacity` only, and style the resting state in CSS.                                                                                                                       |
| `useScrollProgress(cb, { start, end })` | `cb(0..1)` through hamo's `useScrollTrigger` (Lenis-aware, no forced layout). Write to refs, never to state. For sticky scenes, use `start: 'top top', end: 'bottom bottom'` on the tall wrapper.                                                                   |

**Rules**

- anime.js loads lazily (`load-anime.ts`). Never import it statically into a component.
- Under reduced motion, every hook does nothing and leaves the CSS state.
- Every hook reverts its animation or split on unmount.
- `DeviceTierProvider` is mounted once in `app/(site)/layout.tsx`. The GPU benchmark runs at most once per visit, after `window.load`, and its data is self-hosted in `public/gpu-benchmarks/`.
