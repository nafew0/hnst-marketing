/** The query parameter a prospect's tagged link carries: `/?p=…`. */
export const PROSPECT_PARAM = 'p'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** What a token looks like; anything else in `?p=` is ignored. */
export const TOKEN_PATTERN = /^[A-Za-z0-9]{8,32}$/u

/** Unguessable and short enough to read out: 12 characters, about 70 bits. */
export function newProspectToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('')
}
