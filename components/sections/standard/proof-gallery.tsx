'use client'
import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'

import { Image } from '@/components/ui/image'

interface ProofImage {
  src: string
  alt: string
  width: number
  height: number
}
export interface ProofItem {
  id: string
  title: string
  caption: string
  placeholder: string
  image: ProofImage | null
}
interface ProofGalleryProps {
  items: ProofItem[]
  closeLabel: string
  openLabel: string
}
interface LightboxProps {
  image: ProofImage
  title: string
  caption: string
  closeLabel: string
  openLabel: string
}
function ProofLightbox({
  image,
  title,
  caption,
  closeLabel,
  openLabel,
}: LightboxProps) {
  const portalRef = useRef<HTMLDivElement>(null)
  function labelFocusGuards(open: boolean) {
    if (!open) return
    // Base UI exposes its VoiceOver focus guards as buttons in WebKit. This
    // lightbox has one control; name those guards for that control while keeping
    // their focus-wrap behavior intact.
    for (const guard of portalRef.current?.querySelectorAll(
      '[data-base-ui-focus-guard]'
    ) ?? [])
      guard.setAttribute('aria-label', closeLabel)
  }
  return (
    <Dialog.Root onOpenChangeComplete={labelFocusGuards}>
      <Dialog.Trigger
        type="button"
        aria-label={`${openLabel}: ${title}`}
        className="block w-full rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 800px) 40vw, 90vw"
          className="h-auto w-full rounded-[8px]"
        />
      </Dialog.Trigger>
      <Dialog.Portal ref={portalRef}>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-void-deep/90" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[101] max-h-[85dvh] w-[calc(100%_-_32px)] max-w-[900px] -translate-1/2 overflow-y-auto rounded-[16px] border border-gold/40 bg-void dr-p-24 text-starlight focus:outline-none">
          <div className="flex items-start justify-between dr-gap-24">
            <Dialog.Title className="h3">{title}</Dialog.Title>
            <Dialog.Close
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-[8px] border border-gold/30 px-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {closeLabel}
            </Dialog.Close>
          </div>
          <Dialog.Description className="dr-my-24 p text-silver">
            {caption}
          </Dialog.Description>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="900px"
            className="h-auto w-full"
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export function ProofGallery({
  items,
  closeLabel,
  openLabel,
}: ProofGalleryProps) {
  return (
    <div className="grid dr-gap-24 dt:grid-cols-2">
      {items.map((item) => (
        <figure
          key={item.id}
          className="min-w-0 rounded-[16px] border border-gold/25 bg-void-2 dr-p-24"
        >
          {item.image ? (
            <ProofLightbox
              image={item.image}
              title={item.title}
              caption={item.caption}
              closeLabel={closeLabel}
              openLabel={openLabel}
            />
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-[8px] border border-dashed border-gold/30 dr-p-24">
              <p className="caption text-silver">{item.placeholder}</p>
            </div>
          )}
          <figcaption className="dr-mt-24">
            <h3 className="h4">{item.title}</h3>
            <p className="dr-mt-12 p text-silver">{item.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
