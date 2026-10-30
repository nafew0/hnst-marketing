import { z } from 'zod'

import { BookingForm } from '@/components/forms/booking-form'
import { BookingReceipt } from '@/components/forms/booking-receipt'
import { MagnetForm } from '@/components/forms/lead-form'
import {
  CmsUnavailable,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { ProcessSteps } from '@/components/sections/standard/process-steps'
import { ProofGallery } from '@/components/sections/standard/proof-gallery'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { bookingCopySchema, leadCopySchema } from '@/lib/cms/form-copy'
import type { Page, SiteSetting, Media } from '@/lib/cms/payload-types'
import { APP_BASE_URL } from '@/lib/env'

type ContentBlock = NonNullable<Page['blocks']>[number]
function mediaImage(media: number | Media | null | undefined) {
  const parsed = z
    .object({
      url: z.string(),
      alt: z.string(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
    })
    .safeParse(media)
  if (!parsed.success) return null
  const url = new URL(parsed.data.url, APP_BASE_URL)
  if (url.origin !== new URL(APP_BASE_URL).origin) return null
  return {
    src: url.pathname,
    alt: parsed.data.alt,
    width: parsed.data.width ?? 1200,
    height: parsed.data.height ?? 800,
  }
}
export function Wave3Block({
  block,
  settings,
}: {
  block: ContentBlock
  settings: SiteSetting | null
}) {
  switch (block.blockType) {
    case 'processSteps':
      return <ProcessSteps items={block.items} note={block.note} />
    case 'timeline':
      return (
        <ol className="flex flex-col dr-gap-32 border-l border-gold/40 dr-pl-32">
          {block.items?.map((item) => (
            <li key={item.id ?? item.title}>
              <p className="eyebrow text-gold">{item.date}</p>
              <Heading as="h3" size="h3" className="dr-mt-12">
                {item.title}
              </Heading>
              <p className="dr-mt-16 max-w-[720px] p text-silver">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      )
    case 'bioCards':
      return (
        <>
          <div className="grid dr-gap-24 dt:grid-cols-2">
            {block.items?.map((item) => {
              const photo = mediaImage(item.photo)
              return (
                <article
                  key={item.id ?? item.name}
                  className="rounded-[16px] border border-gold/30 bg-void-2 dr-p-24"
                >
                  {photo ? (
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes="40vw"
                      className="h-auto w-full rounded-[8px]"
                    />
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center border border-dashed border-gold/30 dr-p-24">
                      <p className="caption text-silver">{item.placeholder}</p>
                    </div>
                  )}
                  <p className="dr-mt-24 eyebrow text-gold">{item.role}</p>
                  <Heading as="h3" size="h3" className="dr-mt-12">
                    {item.name}
                  </Heading>
                  <p className="dr-mt-16 p text-silver">{item.body}</p>
                </article>
              )
            })}
          </div>
          {block.experienceApproved && block.experienceLabel && (
            <p className="h3 text-gold">{block.experienceLabel}</p>
          )}
        </>
      )
    case 'proofGallery':
      return (
        <ProofGallery
          closeLabel={block.closeLabel}
          openLabel={block.openLabel}
          items={(block.items ?? []).map((item, index) => ({
            id: item.id ?? String(index),
            title: item.title,
            caption: item.caption,
            placeholder: item.placeholder,
            image: mediaImage(item.image),
          }))}
        />
      )
    case 'research':
      return (
        <blockquote className="rounded-[16px] border border-gold/30 bg-void-2 dr-p-32">
          <p className="p-big">{block.body}</p>
          <footer className="dr-mt-24 caption text-silver">
            {block.attribution}
          </footer>
        </blockquote>
      )
    case 'magnet': {
      const copy = leadCopySchema.safeParse(block.copy)
      if (!copy.success) return <CmsUnavailable />
      return (
        <div className="grid items-start dr-gap-32 dt:grid-cols-2">
          <div className="flex flex-col dr-gap-24">
            <div className="flex min-h-[240px] flex-col justify-center rounded-[16px] border border-gold/30 bg-nebula-deep dr-p-32">
              <p className="h2 text-gold">{block.title}</p>
              <p className="dr-mt-24 caption text-silver">
                {block.placeholder}
              </p>
            </div>
            <ul className="dr-space-y-12 list-disc dr-pl-24 p">
              {block.bullets?.map((item) => (
                <li key={item.id ?? item.text}>{item.text}</li>
              ))}
            </ul>
            <p className="caption text-silver">{block.notice}</p>
          </div>
          <div className="rounded-[16px] border border-gold/30 bg-void-2 dr-p-24">
            <MagnetForm consent={consentCopy(settings)} copy={copy.data} />
          </div>
        </div>
      )
    }
    case 'booking': {
      const copy = bookingCopySchema.safeParse(block.copy)
      if (!copy.success) return <CmsUnavailable />
      return (
        <BookingForm
          copy={copy.data}
          consent={consentCopy(settings)}
          embedUrl={settings?.bookingEmbedUrl ?? null}
          questions={(settings?.qualifyingQuestions ?? []).map(
            (item, index) => ({
              id: item.id ?? `question-${index}`,
              question: item.question,
            })
          )}
        />
      )
    }
    case 'bookingReceipt': {
      const copy = bookingCopySchema.safeParse(block.copy)
      return copy.success ? (
        <BookingReceipt copy={copy.data} />
      ) : (
        <CmsUnavailable />
      )
    }
    default:
      return null
  }
}
