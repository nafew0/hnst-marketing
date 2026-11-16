/**
 * The brand's cinematic worlds: short loops in `public/worlds`, encoded from the
 * HONEST Brand Library's `video-cinematic-worlds` set. Each page gets one behind
 * its headline and one between its sections.
 */
export type WorldClip =
  | 'amber-moon'
  | 'astronaut-window'
  | 'canyon'
  | 'cockpit'
  | 'desert-planet'
  | 'frontier-street'
  | 'lunar-horizon'
  | 'lunar-walk'
  | 'pink-mountains'
  | 'ringed-mist'
  | 'ringed-orbit'
  | 'silk'

export interface WorldScenes {
  hero: WorldClip
  /** Between the page's sections. */
  band: WorldClip
  /** The closing call to action. */
  closing: WorldClip
}

/** Where each clip's subject sits, so a phone's narrow crop keeps it in frame. */
export const CLIP_FOCUS = {
  'amber-moon': '72% 50%',
  'astronaut-window': '50% 50%',
  canyon: '45% 30%',
  cockpit: '50% 40%',
  'desert-planet': '72% 25%',
  'frontier-street': '50% 55%',
  'lunar-horizon': '32% 22%',
  'lunar-walk': '42% 50%',
  'pink-mountains': '50% 50%',
  'ringed-mist': '76% 22%',
  'ringed-orbit': '62% 50%',
  silk: '50% 50%',
} satisfies Record<WorldClip, string>

const DEFAULT_WORLD: WorldScenes = {
  hero: 'silk',
  band: 'desert-planet',
  closing: 'amber-moon',
}

const PAGE_WORLDS = new Map<string, WorldScenes>(
  Object.entries({
    packages: {
      hero: 'ringed-orbit',
      band: 'desert-planet',
      closing: 'amber-moon',
    },
    'how-it-works': {
      hero: 'lunar-walk',
      band: 'lunar-horizon',
      closing: 'ringed-mist',
    },
    proof: { hero: 'cockpit', band: 'astronaut-window', closing: 'amber-moon' },
    about: {
      hero: 'pink-mountains',
      band: 'frontier-street',
      closing: 'ringed-orbit',
    },
    'the-honest-marketer': {
      hero: 'frontier-street',
      band: 'canyon',
      closing: 'lunar-horizon',
    },
    book: { hero: 'astronaut-window', band: 'silk', closing: 'amber-moon' },
    contact: { hero: 'amber-moon', band: 'silk', closing: 'pink-mountains' },
    'packages/basic-diy': {
      hero: 'canyon',
      band: 'desert-planet',
      closing: 'amber-moon',
    },
    'packages/executive': {
      hero: 'desert-planet',
      band: 'canyon',
      closing: 'amber-moon',
    },
    'packages/founder': {
      hero: 'ringed-mist',
      band: 'lunar-horizon',
      closing: 'amber-moon',
    },
    'packages/diamond': {
      hero: 'ringed-orbit',
      band: 'cockpit',
      closing: 'amber-moon',
    },
  } satisfies Record<string, WorldScenes>)
)

/** Each clip with the name the CMS's scene picker shows. */
export const WORLD_CLIPS = [
  { value: 'amber-moon', label: 'Amber moon' },
  { value: 'astronaut-window', label: 'Astronaut at the window' },
  { value: 'canyon', label: 'Canyon' },
  { value: 'cockpit', label: 'Cockpit' },
  { value: 'desert-planet', label: 'Desert planet' },
  { value: 'frontier-street', label: 'Frontier street' },
  { value: 'lunar-horizon', label: 'Lunar horizon' },
  { value: 'lunar-walk', label: 'Lunar walk' },
  { value: 'pink-mountains', label: 'Pink mountains' },
  { value: 'ringed-mist', label: 'Ringed planet in mist' },
  { value: 'ringed-orbit', label: 'Ringed planet in orbit' },
  { value: 'silk', label: 'Golden silk' },
] as const satisfies readonly { value: WorldClip; label: string }[]

const isClip = (value: string | null | undefined): value is WorldClip =>
  WORLD_CLIPS.some((clip) => clip.value === value)

/**
 * A page's scenes: the ones its editor picked in the CMS (Pages → Background
 * scenes), and this file's choice for any left on "Default".
 */
export function worldFor(
  slug: string,
  picked?: {
    hero?: string | null
    band?: string | null
    closing?: string | null
  } | null
): WorldScenes {
  const base = PAGE_WORLDS.get(slug) ?? DEFAULT_WORLD
  return {
    hero: isClip(picked?.hero) ? picked.hero : base.hero,
    band: isClip(picked?.band) ? picked.band : base.band,
    closing: isClip(picked?.closing) ? picked.closing : base.closing,
  }
}
