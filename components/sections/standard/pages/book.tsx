import { ContentBlocks } from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'

import s from '@/components/apps/mail/mail.module.css'

export async function BookContent() {
  const content = await loadPageContent('book')
  const page = content.page
  if (PHONE_LAYOUT && page)
    return (
      <>
        <DraftIndicator
          visible={
            content.preview &&
            (page._status === 'draft' || content.settings?._status === 'draft')
          }
        />
        {page.blocks?.map((block, index) => (
          <div
            key={block.id ?? index}
            className={block.blockType === 'booking' ? undefined : s.desktop}
          >
            {block.blockType === 'booking' && (
              <div className={s.phone}>
                <PhoneScreen title="Calendar">
                  <p className="caption text-silver">
                    Choose a day and time for your discovery call.
                  </p>
                </PhoneScreen>
              </div>
            )}
            <ContentBlocks
              page={{ ...page, blocks: [block] }}
              settings={content.settings}
              packages={[]}
              faqs={[]}
            />
          </div>
        ))}
      </>
    )
  return <StandardPageContent {...content} />
}
