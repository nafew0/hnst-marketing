'use server'

import { z } from 'zod'

import { getCms } from '@/lib/cms/data'

import { TOKEN_PATTERN } from './token'

export interface VisitInput {
  token: string
  kind: 'opened' | 'page'
  path: string
  device: 'phone' | 'computer'
}

export interface VisitResult {
  status: number
  message: string
  /** The name to greet them by, when Prospects says to. */
  name: string | null
}

const visitSchema = z.object({
  token: z.string().regex(TOKEN_PATTERN),
  kind: z.enum(['opened', 'page']),
  path: z
    .string()
    .max(200)
    .regex(/^\/[\w\-./]*$/u),
  device: z.enum(['phone', 'computer']),
})

/** More than this in an hour from one link is a loop or a forwarded link: stop logging. */
const PER_HOUR = 120

/**
 * Logs a visit from a prospect's tagged link (Admin → Prospects): when the
 * link was opened, and the pages viewed after it with analytics consent. No
 * cookie and no IP address: only the link's tag, the page and phone or
 * computer. An unknown or malformed tag logs nothing.
 */
export async function recordProspectVisit(
  input: VisitInput
): Promise<VisitResult> {
  const parsed = visitSchema.safeParse(input)
  if (!parsed.success)
    return { status: 400, message: 'Not a prospect link', name: null }
  const cms = await getCms()
  if (!cms) return { status: 503, message: 'No CMS', name: null }
  const { token, kind, path, device } = parsed.data
  try {
    const prospect = (
      await cms.find({
        collection: 'prospects',
        where: { token: { equals: token } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    ).docs[0]
    if (!prospect) return { status: 404, message: 'Unknown link', name: null }
    const name = prospect.greet === false ? null : prospect.name

    const { totalDocs } = await cms.count({
      collection: 'prospect-visits',
      where: {
        and: [
          { prospect: { equals: prospect.id } },
          {
            createdAt: {
              greater_than: new Date(Date.now() - 3_600_000).toISOString(),
            },
          },
        ],
      },
      overrideAccess: true,
    })
    if (totalDocs >= PER_HOUR)
      return { status: 429, message: 'Enough for now', name }

    await cms.create({
      collection: 'prospect-visits',
      data: { prospect: prospect.id, kind, path, device },
      overrideAccess: true,
    })
    await cms.update({
      collection: 'prospects',
      id: prospect.id,
      data: { lastVisit: new Date().toISOString() },
      overrideAccess: true,
    })
    return { status: 200, message: 'Logged', name }
  } catch (error) {
    console.error('prospect visit not logged', error)
    return { status: 500, message: 'Not logged', name: null }
  }
}
