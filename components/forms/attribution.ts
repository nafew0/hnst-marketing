import { utmSchema, type Utm } from '@/lib/contracts'
const KEY = 'hnst:first-touch'
let memory: Utm | undefined
export function captureAttribution(): Utm {
  if (memory) return memory
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) {
      const result = utmSchema.safeParse(JSON.parse(saved))
      if (result.success) {
        memory = result.data
        return memory
      }
    }
  } catch {
    /* Storage can be disabled. Keep attribution in memory. */
  }
  const params = new URL(window.location.href).searchParams
  const value: Utm = {}
  for (const name of [
    'source',
    'medium',
    'campaign',
    'content',
    'term',
  ] as const) {
    const item = params.get(`utm_${name}`)
    if (item) value[name] = item.slice(0, 200)
  }
  memory = value
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* The form still works without persistent storage. */
  }
  return value
}
