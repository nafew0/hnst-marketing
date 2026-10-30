# 3D world

The HONEST scenes from Phase 4, all generated in code: no models, textures or video. Try each one at `/lab/3d` (noindex), which has a tier switcher, brand-value sliders, a triangle budget readout and the poster renderer.

## How a scene reaches the screen

Satus has one persistent root `<Canvas>`. It is orthographic (1 unit = 1 CSS px), draws on demand and sits **behind the page** (`z-index: -1`), so a section that shows 3D keeps a transparent background.

`<ViewportScene>` is the only way in:

1. **DOM side.** It renders a `div` that the scene tracks, plus a `fallback` (the poster) underneath. The fallback fades out after the first live frame.
2. **Canvas side.** Through `<WebGLTunnel>`, `ViewportRenderer` renders the children with **their own perspective camera** into an offscreen target:
   - HalfFloat, 4× MSAA, sized to the element at the tier's DPR cap (1.25 or 1.5);
   - only while the element is on screen;
   - held awake with a lease while `animate` is true.
3. **Bloom (tier 3 only).** `soft-bloom.ts` is a dual-filter bloom that runs at quarter resolution and below.
4. **Composite.** A plane placed by `useWebGLRect` adds the bloom, applies ACES tone mapping and sRGB encoding, and blends premultiplied over the page. The root canvas therefore stays `linear` + `flat`, as Satus expects.

```tsx
<ViewportScene
  id="hero"
  className="h-svh"
  camera={{ fov: 35, position: [0, 0, 6] }}
  fallback={<Image src="/posters/hero-preview.webp" alt="" fill preload />}
>
  <NebulaGas light={0.25} />
  <Starfield scrollRef={progressRef} />
  <Emblem3D />
</ViewportScene>
```

Tier 0 and tier 1 (reduced motion, Save-Data, phones, narrow or software-GPU screens) never mount the renderer: they get the fallback only.

## Scenes

| Export           | What it is                                                                                                                                                                                                                                                                                                    | Drive it with                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `Emblem3D`       | The logo's starburst-and-crescent and the H, N, S, T of its wordmark, extruded in brushed gold (glyph outlines from `components/ui/logo/paths.ts`, so no typeface JSON ships). A clipping plane draws the crescent on; the rays flare with emissive light. The anime.js Three adapter runs the ±12° idle yaw. | `drawProgress`, `flare` (0–1). Omit both to play the intro.                      |
| `NebulaGas`      | Domain-warped 5-octave fbm in the `nebula-*` palette, drifting, with mouse parallax and an optional light behind it. Rendered at a third of the scene's resolution and upsampled, because the gas has no hard edges.                                                                                          | `speed`, `density`, `light`, `lightPosition`                                     |
| `Starfield`      | 3,000 twinkling points in three depth layers.                                                                                                                                                                                                                                                                 | `scrollRef` (0–1 parallax)                                                       |
| `GoldenPlatter`  | A 20-point lathe dish carrying the six deliverables, which dissolve in. 26 gold beads orbit it, moved entirely in the vertex shader.                                                                                                                                                                          | `progress` (0–1), or `onPlatterTimeline` to scrub the anime.js timeline yourself |
| `DuneTerrain`    | Simplex dunes lit by a golden-hour sun, fogged into the sky behind them, so the plane has no visible edge.                                                                                                                                                                                                    | `cameraGlideRef` / `cameraGlide` (0–1)                                           |
| `GoldGlintPlane` | Brushed gold with an anisotropic streak (faint at rest, bright on hover) and a molten reveal edge. For the package cards.                                                                                                                                                                                     | `hover`, `reveal` (0–1)                                                          |

Building blocks: `goldMaterial()`, `smokedGlassMaterial()`, `<StudioLights>` (six Lightformers baked once into the environment), `withDissolve(material)`, and `brandColor(name)`. three cannot parse `oklch()`, so `brandColor` converts `brand.config.ts` OKLCH to linear sRGB. Every colour comes from the config: change `nebula-glow` and the gas re-colours.

## Budgets

|                     | Limit                        | Where it is set                                                                                                                                       |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Triangles on screen | 60k (P4 acceptance)          | Measured per scene from `gl.info` (`scene-stats.ts`). Emblem ≈ 7.7k, platter ≈ 10.4k, dunes ≈ 18.4k; the lab peaks at 44k with four scenes on screen. |
| DPR                 | 1.25 (tier 2) / 1.5 (tier 3) | `state.maxDpr` from `useDeviceTier()`, and never above Satus's adaptive canvas DPR                                                                    |
| Bloom               | Tier 3 only                  | `state.bloom`; strength from `brand.three.bloomStrength`                                                                                              |
| Frame rate          | 60 fps per scene at tier 3   | Check on `/lab/3d` (FPS readout)                                                                                                                      |

## Posters and frame sequences

In development, every lab card has **Render poster**. It re-renders the scene at 1600 px wide, whatever the live DPR, and saves `public/posters/<id>.webp` through the dev-only `POST /lab/3d/poster` route (404 in production). **Render demo sequence** on the dunes card saves 48 frames and a `manifest.json` to `public/posters/sequence/` for `ScrollSequence`. Re-render after changing a scene, so tier 0–1 visitors see what tier 3 sees.

## Gotchas

- **anime.js animations and timelines are thenables.** They settle on complete. Returning one from an `async` function, or from a `.then` callback, waits for it to finish, and a paused timeline never finishes. Build them synchronously once `loadAnime()` has resolved (see `createPlatterTimeline`), and give revert callbacks block bodies.
- Mutate three objects in plain helper functions outside the component (`react/immutability`).
- The anti-slop lint bans the word "shape" in any identifier, including three's API. Reach `toShapes` through a constant key (`emblem-geometry.ts`).
- A flat gold face mirrors one direction of the environment. If a surface reads black, add or move a Lightformer where its reflection points; don't brighten the material.
