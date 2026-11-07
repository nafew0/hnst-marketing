'use client'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useEffect, useId, useState } from 'react'

import { loadNotes } from '@/components/apps/notes/load'
import { editNote, newNote, useNotes } from '@/components/apps/notes/store'
import { LeadForm } from '@/components/forms/lead-form'
import { setDraftField, submissionFor } from '@/components/forms/visit-drafts'
import { Button } from '@/components/ui/button'
import { GroupedList } from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { Sheet } from '@/components/ui/phone/kit/sheet'
import { SheetRow } from '@/components/ui/phone/kit/sheet-row'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui/phone/kit/states'
import { track } from '@/lib/track'

export default function NotesApp() {
  const id = useId()
  const { notes, active } = useNotes()
  const note = notes.find((item) => item.id === active)
  const [content, setContent] = useState<Awaited<
    ReturnType<typeof loadNotes>
  > | null>(null)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  useEffect(() => {
    let current = true
    track('cta_clicked', { app: 'notes', action: 'open' })
    void loadNotes().then(
      (value) => {
        if (current) {
          setContent(value)
          setFailed(false)
        }
      },
      () => {
        if (current) setFailed(true)
      }
    )
    return () => {
      current = false
    }
  }, [revision])
  return (
    <PhoneScreen title="Notes">
      <div className="flex flex-col gap-[24px]">
        <p className="caption text-silver">
          Your notes stay on this page for this visit. They are sent only when
          you choose Send to HONEST.
        </p>
        <Button
          onClick={() => {
            newNote()
            setSent(false)
          }}
        >
          New note
        </Button>
        {notes.length > 0 && (
          <GroupedList header="Your notes">
            {notes.map((item) => (
              <li key={item.id} className="p-[16px]">
                <Button
                  variant="ghost"
                  onClick={() => {
                    useNotes.setState({ active: item.id })
                    setSent(submissionFor(`note-${item.id}`).complete)
                  }}
                >
                  {item.title || 'Untitled note'}
                </Button>
              </li>
            ))}
          </GroupedList>
        )}
        {note && (
          <section className="flex flex-col gap-[16px]" aria-label="Your note">
            <label htmlFor={`${id}-title`}>Title</label>
            <input
              id={`${id}-title`}
              value={note.title}
              maxLength={120}
              onChange={(event) =>
                editNote(note.id, 'title', event.target.value)
              }
              className="min-h-[44px] rounded-[8px] border border-gold/30 p-[12px]"
            />
            <label htmlFor={`${id}-body`}>Note</label>
            <textarea
              id={`${id}-body`}
              rows={8}
              value={note.body}
              maxLength={4000}
              onChange={(event) =>
                editNote(note.id, 'body', event.target.value)
              }
              className="rounded-[8px] border border-gold/30 p-[12px]"
            />
            {sent ? (
              <EmptyState title="Sent">
                <p>Your note has been received.</p>
              </EmptyState>
            ) : (
              <Button
                disabled={!note.body.trim() || !content}
                onClick={() => {
                  setDraftField(`note-${note.id}`, 'message', note.body)
                  setDraftField(
                    `note-${note.id}`,
                    'subject',
                    note.title || 'A note for HONEST'
                  )
                  setSending(true)
                }}
              >
                Send to HONEST
              </Button>
            )}
            {sending && content && (
              <Sheet title="Send your note" open onOpenChange={setSending}>
                <LeadForm
                  type="contact"
                  consent={content.consent}
                  draftKey={`note-${note.id}`}
                  messageLabel="Note to send"
                  onSent={() => {
                    setSent(true)
                    setSending(false)
                  }}
                />
              </Sheet>
            )}
          </section>
        )}
        {failed && (
          <ErrorState
            title="Notes could not load"
            onRetry={() => setRevision((value) => value + 1)}
          />
        )}
        {!failed && !content && <LoadingState title="Loading HONEST notes" />}
        {!failed && content && content.notes.length > 0 && (
          <GroupedList header="From HONEST">
            {content.notes.map((item) => (
              <SheetRow key={item.id} title={item.title}>
                <RichText data={item.body} />
              </SheetRow>
            ))}
          </GroupedList>
        )}
        {!failed && content?.notes.length === 0 && (
          <EmptyState title="No published HONEST notes yet" />
        )}
      </div>
    </PhoneScreen>
  )
}
