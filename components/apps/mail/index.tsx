'use client'
import { useEffect, useState } from 'react'

import { FormSheet } from '@/components/apps/mail/form-sheet'
import { LeadForm, type ConsentCopy } from '@/components/forms/lead-form'
import { submissionFor } from '@/components/forms/visit-drafts'
import { Link } from '@/components/ui/link'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { GroupedList, ListRow } from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { EmptyState } from '@/components/ui/phone/kit/states'
import { track } from '@/lib/track'

import s from './mail.module.css'

export function MailApp({
  consent,
  email,
}: {
  consent: ConsentCopy
  email: string
}) {
  const [phoneCompose, setPhoneCompose] = useState(false)
  const [sent, setSent] = useState(submissionFor('mail').complete)
  useEffect(() => {
    if (PHONE_LAYOUT) track('cta_clicked', { app: 'mail', action: 'open' })
  }, [])
  if (!PHONE_LAYOUT) return <LeadForm type="contact" consent={consent} />
  return (
    <div className={s.compose}>
      <div className={s.phone}>
        <PhoneScreen title="Mail">
          <GroupedList>
            <ListRow title="To" detail={email} />
          </GroupedList>
        </PhoneScreen>
      </div>
      {sent ? (
        <EmptyState title="Sent">
          <p>Your message has been received.</p>
        </EmptyState>
      ) : (
        <FormSheet title="Compose message" onOpen={() => setPhoneCompose(true)}>
          <LeadForm
            type="contact"
            consent={consent}
            draftKey="mail"
            compose={phoneCompose}
            {...(phoneCompose && { onSent: () => setSent(true) })}
          />
        </FormSheet>
      )}
      <div className={s.phone}>
        <Link href={`mailto:${email}`} className="link text-gold">
          Use my mail app
        </Link>
      </div>
    </div>
  )
}
