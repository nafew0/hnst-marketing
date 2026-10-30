import { copyStatus } from '@/components/sections/signature/copy'

/**
 * Small fixed label that says the homepage text is unapproved, on every
 * environment, so a draft can't reach launch unnoticed. Gone once `copyStatus`
 * is 'approved'.
 */
export function DraftMark() {
  if (copyStatus !== 'draft') return null
  return (
    <p className="fixed bottom-gap left-gap z-10 rounded-full border border-gold/30 bg-void-deep dr-px-12 dr-py-4 caption text-silver">
      Draft copy, pending approval
    </p>
  )
}
