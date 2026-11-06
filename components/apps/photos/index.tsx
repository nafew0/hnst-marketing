import { proofStandIns } from '@/components/sections/standard/stand-ins'
import { getPage } from '@/lib/cms/data'

import { blockOf, cmsImage } from '../shared/cms'
import { type ProofPhoto, PhotosView } from './view'

/**
 * Photos on the phone (docs/phases/M5.md): the Proof page's gallery with its
 * labels and stand-ins, the visitors' wall, the brand's worlds, and this
 * visit's own shots. The Proof album reads the same CMS page as `/proof`.
 */
export async function PhotosApp() {
  const page = await getPage('proof')
  const hero = blockOf(page, 'hero')
  const gallery = blockOf(page, 'proofGallery')
  const research = blockOf(page, 'research')
  const proof: ProofPhoto[] = (gallery?.items ?? []).map((item, index) => ({
    id: item.id ?? String(index),
    title: item.title,
    caption: item.caption,
    placeholder: item.placeholder,
    image: cmsImage(item.image) ?? proofStandIns[index] ?? null,
  }))
  return (
    <PhotosView
      intro={hero?.title ?? null}
      proof={proof}
      research={
        research
          ? {
              title: research.title,
              body: research.body,
              attribution: research.attribution,
            }
          : null
      }
    />
  )
}
