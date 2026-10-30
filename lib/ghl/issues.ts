import type { z } from 'zod'

export function issueFields(issues: z.core.$ZodIssue[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const path = issue.path.map(String).join('.') || '(root)'
    fields[path] ??= issue.message
  }
  return fields
}
