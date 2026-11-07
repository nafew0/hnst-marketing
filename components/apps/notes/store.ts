'use client'
import { create } from 'zustand'

/** Visit memory only. Reload discards these notes. */
export const useNotes = create<{
  notes: { id: string; title: string; body: string }[]
  active: string | null
}>(() => ({ notes: [], active: null }))
export function newNote() {
  const id = crypto.randomUUID()
  useNotes.setState((state) => ({
    notes: [...state.notes, { id, title: '', body: '' }],
    active: id,
  }))
}
export function editNote(id: string, field: 'title' | 'body', value: string) {
  useNotes.setState((state) => ({
    notes: state.notes.map((note) =>
      note.id === id ? { ...note, [field]: value } : note
    ),
  }))
}
