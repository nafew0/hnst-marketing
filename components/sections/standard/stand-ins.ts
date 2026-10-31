/**
 * Images shown until the real ones are uploaded in the CMS, which take over on
 * their own. The screens are drawn mock-ups marked "Sample", so nothing passes
 * for a real record; the portraits are brand art, not made-up people.
 */
const screen = (name: string, alt: string) => ({
  src: `/stand-ins/${name}.webp`,
  alt: `Sample mock-up: ${alt}`,
  width: 1600,
  height: 1000,
})

const art = (name: string, alt: string) => ({
  src: `/stand-ins/${name}.webp`,
  alt,
  width: 1200,
  height: 800,
})

const hub = screen(
  'notion-hub',
  'a Notion hub linking the brand, research and content.'
)
const brandBible = screen(
  'notion-brand-bible',
  'a Notion Brand Bible with colours and voice.'
)
const researchLab = screen(
  'notion-research-lab',
  'a Notion table of market scores.'
)
const contentCalendar = screen(
  'notion-content-calendar',
  'a Notion content calendar for a month.'
)
const pipeline = screen(
  'crm-pipeline',
  'a CRM pipeline with private details blurred.'
)
const callCalendar = screen(
  'crm-calendar',
  'a CRM calendar of discovery calls.'
)

/** In the order of the Proof page's gallery. */
export const proofStandIns = [
  hub,
  brandBible,
  researchLab,
  contentCalendar,
  pipeline,
  callCalendar,
]

/** The homepage's three proof shots. */
export const homeProofStandIns = { brandBible, researchLab, pipeline }

/** In the order of the About page's bio cards. */
export const bioStandIns = [
  art('founder', 'An astronaut lighting a lantern on a mountain ridge.'),
  art('co-founder', 'An astronaut at the controls of a spacecraft.'),
]

export const ebookCoverStandIn = {
  src: '/stand-ins/ebook-cover.webp',
  width: 1600,
  height: 1000,
}
