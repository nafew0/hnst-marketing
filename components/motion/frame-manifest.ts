import { z } from 'zod'

/**
 * A frame-sequence chapter, as written by P5's `scripts/media manifest`
 * (docs/PLAN.md § 8.6). URLs are absolute paths (`/media/<hash>/…`).
 */
export const frameManifestSchema = z.object({
  chapter: z.string().min(1),
  fps: z.number().positive(),
  frames: z.number().int().positive(),
  desktop: z.array(z.string().min(1)).min(1),
  mobile: z.array(z.string().min(1)).min(1),
  poster: z.string().min(1),
  bytes: z.number().int().nonnegative().optional(),
})

export type FrameManifest = z.infer<typeof frameManifestSchema>
