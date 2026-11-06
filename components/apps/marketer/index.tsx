import { consentCopy } from '@/components/sections/standard/catalog'
import { ebookCoverStandIn } from '@/components/sections/standard/stand-ins'
import { Image } from '@/components/ui/image'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { EmptyState } from '@/components/ui/phone/kit/states'
import { getPage, getSettings } from '@/lib/cms/data'
import { leadCopySchema } from '@/lib/cms/form-copy'

import { blockOf } from '../shared/cms'
import { GetTheBook } from './get'

import s from '../shared/apps.module.css'

/**
 * The HONEST Marketer on the phone, Books style (docs/phases/M5.md): the
 * cover on a shelf, what's inside, and "Get the book", which opens the same
 * magnet form as the page. The cover is a stand-in until the real one exists.
 */
export async function MarketerApp() {
  const [page, settings] = await Promise.all([
    getPage('the-honest-marketer'),
    getSettings(),
  ])
  const magnet = blockOf(page, 'magnet')
  const copy = leadCopySchema.safeParse(magnet?.copy)
  if (!magnet || !copy.success)
    return (
      <PhoneScreen title="The HONEST Marketer">
        <EmptyState title="Page in preparation">
          We’re preparing this page. Please check back soon.
        </EmptyState>
      </PhoneScreen>
    )
  return (
    <PhoneScreen title={magnet.title}>
      <div className={s.book}>
        <div className={s.cover}>
          <Image
            {...ebookCoverStandIn}
            alt={`${magnet.title} eBook cover`}
            mobileSize="70vw"
            desktopSize="20vw"
          />
        </div>
        <span aria-hidden="true" className={s.shelf} />
        <GetTheBook consent={consentCopy(settings)} copy={copy.data} />
        <ul className={s.bullets}>
          {magnet.bullets?.map((item) => (
            <li key={item.id ?? item.text}>{item.text}</li>
          ))}
        </ul>
        <p className={s.notice}>{magnet.notice}</p>
      </div>
    </PhoneScreen>
  )
}
