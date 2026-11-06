'use client'

import { type ConsentCopy, MagnetForm } from '@/components/forms/lead-form'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/phone/kit/sheet'
import type { LeadCopy } from '@/lib/cms/form-copy'

/** "Get the book": the page's own magnet form, in a sheet. */
export function GetTheBook({
  consent,
  copy,
}: {
  consent: ConsentCopy
  copy: LeadCopy
}) {
  return (
    <Sheet title="Get the book" trigger={<Button>Get the book</Button>}>
      <MagnetForm consent={consent} copy={copy} />
    </Sheet>
  )
}
