import { z } from 'zod'

const ipSchema = z.union([z.ipv4(), z.ipv6()])

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  const candidate =
    first && first !== '' ? first : request.headers.get('x-real-ip')
  if (!candidate) return null
  const parsed = ipSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export function userAgent(request: Request): string | null {
  const agent = request.headers.get('user-agent')
  if (!agent || agent === '') return null
  return agent.slice(0, 500)
}
