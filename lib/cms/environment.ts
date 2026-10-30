import { z } from 'zod'

// P3-owned boundary until Claude incorporates MEDIA_DIR into lib/env.ts.
export const cmsEnvironment = z
  .object({ MEDIA_DIR: z.string().min(1).optional() })
  .parse(process.env)
