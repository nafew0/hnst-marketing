import { create } from 'zustand'

/**
 * The photos taken with Camera this visit, in memory only (docs/phases/M7.md):
 * never written to any browser storage, gone on reload. Camera adds to it;
 * Photos shows them as "Your shots".
 */
export interface Shot {
  id: string
  /** The photo: a JPEG, frame included, longest side at most SHOT_MAX_EDGE. */
  blob: Blob
  /** An object URL for `blob`, revoked when the shot is removed. */
  url: string
  width: number
  height: number
  takenAt: number
}

export const useShots = create<{ shots: Shot[] }>(() => ({ shots: [] }))

export function addShot(shot: Shot) {
  useShots.setState(({ shots }) => ({ shots: [shot, ...shots] }))
}

export function removeShot(id: string) {
  useShots.setState(({ shots }) => {
    const gone = shots.find((shot) => shot.id === id)
    if (gone) URL.revokeObjectURL(gone.url)
    return { shots: shots.filter((shot) => shot.id !== id) }
  })
}

export function findShot(id: string) {
  return useShots.getState().shots.find((shot) => shot.id === id)
}
