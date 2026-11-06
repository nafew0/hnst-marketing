import { bioStandIns } from '@/components/sections/standard/stand-ins'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { GroupedList, ListRow } from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { EmptyState } from '@/components/ui/phone/kit/states'
import { getPage, getSettings } from '@/lib/cms/data'

import { blockOf, cmsImage } from '../shared/cms'

import s from '../shared/apps.module.css'

/**
 * About on the phone (docs/phases/M5.md): a contact card for each person in
 * the CMS's bio cards, and the timeline. Only what the CMS says about anyone:
 * the stand-in portraits are brand art, as on `/about`.
 */
export async function AboutApp() {
  const [page, settings] = await Promise.all([getPage('about'), getSettings()])
  const hero = blockOf(page, 'hero')
  const bios = blockOf(page, 'bioCards')
  const timeline = blockOf(page, 'timeline')
  const cta = blockOf(page, 'cta')
  if (!page)
    return (
      <PhoneScreen title="About">
        <EmptyState title="Page in preparation">
          We’re preparing this page. Please check back soon.
        </EmptyState>
      </PhoneScreen>
    )
  return (
    <PhoneScreen
      title="About"
      accessory={hero && <p className={s.intro}>{hero.title}</p>}
    >
      {bios?.items?.map((person, index) => {
        const photo = cmsImage(person.photo) ?? bioStandIns[index]
        return (
          <article key={person.id ?? person.name} className={s.card}>
            <div className={s.cardHead}>
              {photo ? (
                <span className={s.avatar}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    mobileSize="20vw"
                    desktopSize="5vw"
                  />
                </span>
              ) : (
                <span className={s.placeholder}>{person.placeholder}</span>
              )}
              <div>
                <p className={s.cardRole}>{person.role}</p>
                <h2 className={s.cardName}>{person.name}</h2>
              </div>
            </div>
            <p className={s.cardBody}>{person.body}</p>
          </article>
        )
      })}
      {bios?.experienceApproved && bios.experienceLabel && (
        <p className={s.ctaTitle}>{bios.experienceLabel}</p>
      )}
      {timeline && (
        <GroupedList header={timeline.title}>
          {timeline.items?.map((item) => (
            <ListRow
              key={item.id ?? item.title}
              title={item.title}
              detail={item.date}
              subtitle={item.description}
            />
          ))}
        </GroupedList>
      )}
      {settings?.publicEmail && (
        <GroupedList header="Contact">
          <ListRow
            title="Email"
            detail={settings.publicEmail}
            href={`mailto:${settings.publicEmail}`}
          />
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
