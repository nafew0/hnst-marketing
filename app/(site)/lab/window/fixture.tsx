'use client'

import { Dialog } from '@base-ui/react/dialog'

/** A lightbox inside a window: what `/proof`'s gallery does. */
export function WindowFixture() {
  return (
    <div className="dr-p-32">
      <h1 className="h2">Window fixture</h1>
      <label className="dr-mt-24 flex flex-col dr-gap-8">
        Draft
        <input name="draft" className="border border-gold/40 dr-p-8" />
      </label>
      <label className="dr-mt-16 flex items-center dr-gap-8">
        <input type="checkbox" name="consent" />
        Tick box
      </label>
      <Dialog.Root>
        <Dialog.Trigger className="dr-mt-24 underline">
          Open lightbox
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[200] bg-void-deep/80" />
          <Dialog.Popup
            aria-label="Lightbox"
            data-theme="dark"
            data-lightbox
            className="fixed inset-[10%] z-[201] bg-void-2 dr-p-32"
          >
            <p>Lightbox content</p>
            <Dialog.Close>Close lightbox</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="h-[1600px]" />
      <p>Bottom of the fixture</p>
    </div>
  )
}
