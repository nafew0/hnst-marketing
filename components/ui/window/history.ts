/**
 * How many history entries the open window sits above the page it opened over,
 * so red and yellow can return there with `history.go` rather than pushing a
 * new entry Back would reopen the window from. Stamped on each entry because
 * Back and Forward land on entries in any order.
 */
const DEPTH_KEY = 'hnstWindowDepth'

let depth = 0
let stampedUrl: string | null = null

function stamp(value: number) {
  depth = value
  stampedUrl = location.href
  // No URL argument: Next only re-syncs its router when one is passed.
  history.replaceState({ ...history.state, [DEPTH_KEY]: value }, '')
}

/** Call when a window's route mounts. */
export function syncDepth() {
  // NaN when this entry has no stamp yet.
  const stamped = Number(history.state?.[DEPTH_KEY])
  if (stamped > 0) {
    depth = stamped
    stampedUrl = location.href
  } else if (stampedUrl === location.href) {
    // Next rewrote this entry's state (the content finished loading).
    stamp(depth)
  } else {
    stamp(depth + 1)
  }
}

export function resetDepth() {
  depth = 0
  stampedUrl = null
}

/** Back to the page the window opened over. */
export function returnToBase() {
  history.go(-Math.max(depth, 1))
}
