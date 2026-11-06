import type { Payload } from 'payload'

import { PHONE_SETTINGS_DRAFT } from '@/components/ui/phone/settings'
import { richText } from '@/lib/cms/seed-data'

export const WALL_PRIVACY_DRAFT =
  '[DRAFT] HONEST photo wall — awaiting Founder approval. If you choose to post, we store your photo, optional display name, the consent wording and time, adult confirmation, a removal-token hash and report count. Only approved photos are public. Photos are re-encoded without location metadata. Rejected photos are deleted after 30 days; removed photos are deleted immediately. Keep your private removal link or contact service@hnst.marketing to request removal. No face recognition or face detection is used. Confirm retention of approved photos and consent records before publication.'
export const WALL_RULES_DRAFT =
  '[DRAFT] Wall rules — awaiting Founder approval. You must be 18 or over. Post only photos you have permission to share. No nudity, hate, children, or other people without their consent. Every photo is reviewed before publication. HONEST may reject or remove photos. Visitors’ photos are not clients or endorsements. Use Report for a concern, or your private removal link to remove your photo. Contact service@hnst.marketing for help.'

/** Add drafts without publishing or replacing existing editorial content. */
export async function seedPhone(cms: Payload) {
  const context = { skipRevalidation: true }
  const settings = await cms.findGlobal({ slug: 'site-settings', draft: true })
  if (!settings.phone?.widgets?.nextCallTitle)
    await cms.updateGlobal({
      slug: 'site-settings',
      draft: true,
      context,
      data: { phone: PHONE_SETTINGS_DRAFT },
    })

  const rules = await cms.find({
    collection: 'legal-docs',
    draft: true,
    where: { slug: { equals: 'wall-rules' } },
    limit: 1,
  })
  if (!rules.totalDocs)
    await cms.create({
      collection: 'legal-docs',
      draft: true,
      context,
      data: {
        title: '[DRAFT] Wall rules',
        slug: 'wall-rules',
        body: richText(WALL_RULES_DRAFT),
        version: 'draft-wall-1',
        status: 'draft',
        _status: 'draft',
      },
    })

  const privacy = (
    await cms.find({
      collection: 'legal-docs',
      draft: true,
      where: { slug: { equals: 'privacy' } },
      limit: 1,
    })
  ).docs[0]
  if (privacy && !JSON.stringify(privacy.body).includes('HONEST photo wall'))
    await cms.update({
      collection: 'legal-docs',
      id: privacy.id,
      draft: true,
      context,
      data: {
        body: {
          ...privacy.body,
          root: {
            ...privacy.body.root,
            children: [
              ...privacy.body.root.children,
              ...richText(WALL_PRIVACY_DRAFT).root.children,
            ],
          },
        },
        _status: 'draft',
      },
    })

  for (const [order, title] of [
    '[DRAFT] What’s in the Founder Package',
    '[DRAFT] How it works',
  ].entries()) {
    const existing = await cms.find({
      collection: 'phoneNotes',
      draft: true,
      where: { title: { equals: title } },
      limit: 1,
    })
    if (!existing.totalDocs)
      await cms.create({
        collection: 'phoneNotes',
        draft: true,
        context,
        data: {
          title,
          order,
          body: richText(
            '[DRAFT] Editorial note awaiting Founder copy and approval.'
          ),
          _status: 'draft',
        },
      })
  }
}
