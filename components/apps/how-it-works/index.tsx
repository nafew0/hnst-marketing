import { Button } from '@/components/ui/button'
import {
  GroupedList,
  RowBadge,
  SheetText,
} from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { SheetRow } from '@/components/ui/phone/kit/sheet-row'
import { EmptyState } from '@/components/ui/phone/kit/states'
import { getFaqs, getPage } from '@/lib/cms/data'

import { blockOf } from '../shared/cms'

import s from '../shared/apps.module.css'

/**
 * How it works on the phone, Settings style (docs/phases/M5.md): each step a
 * row that opens its detail, then the process questions. From the same CMS
 * page and FAQs as `/how-it-works`.
 */
export async function HowItWorksApp() {
  const [page, faqs] = await Promise.all([getPage('how-it-works'), getFaqs()])
  const hero = blockOf(page, 'hero')
  const steps = blockOf(page, 'processSteps')
  const questions = blockOf(page, 'faqList')
  const cta = blockOf(page, 'cta')
  if (!page)
    return (
      <PhoneScreen title="How it works">
        <EmptyState title="Page in preparation">
          We’re preparing this page. Please check back soon.
        </EmptyState>
      </PhoneScreen>
    )
  return (
    <PhoneScreen
      title="How it works"
      accessory={
        hero?.description && <p className={s.intro}>{hero.description}</p>
      }
    >
      {steps && (
        <GroupedList header={steps.title} footer={steps.note}>
          {steps.items.map((step, index) => (
            <SheetRow
              key={step.id ?? step.title}
              title={step.title}
              icon={<RowBadge>{index + 1}</RowBadge>}
            >
              <SheetText>{step.description}</SheetText>
            </SheetRow>
          ))}
        </GroupedList>
      )}
      {questions && (
        <GroupedList header={questions.title}>
          {faqs
            .filter(
              (faq) =>
                !questions.category || faq.category === questions.category
            )
            .map((faq) => (
              <SheetRow key={faq.id} title={faq.question}>
                <SheetText>{faq.answer}</SheetText>
              </SheetRow>
            ))}
        </GroupedList>
      )}
      {cta && (
        <div className={s.cta}>
          <p className={s.ctaTitle}>{cta.title}</p>
          <Button href={cta.href}>{cta.label}</Button>
        </div>
      )}
    </PhoneScreen>
  )
}
