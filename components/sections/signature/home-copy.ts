import {
  type PackageFacts,
  type ProcessStep,
  type ProofShot,
  fallbackSteps,
  filmCopy,
  heroCopy,
  homePackages,
  packagesCopy,
  platterCopy,
  proofCopy,
  stepsCopy,
  turnCopy,
} from '@/components/sections/signature/copy'
import type { Homepage, Package } from '@/lib/cms/payload-types'

/**
 * The homepage's words, as the sections read them. The CMS's Homepage global
 * (lib/cms/homepage.ts) edits them; any field left empty, or no CMS at all,
 * falls back to copy.ts. Links, images and the film's timing stay in code.
 */
export interface HomeCopy {
  hero: {
    eyebrow: string
    lines: readonly string[]
    lede: string
    primaryCta: { href: string; label: string }
    secondaryCta: { href: string; label: string }
  }
  film: {
    title: string
    pinnedLine: string
    chapters: readonly {
      label: string
      body: string
      still: string
      stillMobile: string
      alt: string
      end: number
    }[]
  }
  turn: { heading: string; body: string; closing: string }
  platter: {
    eyebrow: string
    heading: string
    body: string
    note: string
    deliverables: readonly { name: string; description: string }[]
  }
  steps: { heading: string; note: string; items: readonly ProcessStep[] }
  packages: {
    eyebrow: string
    heading: string
    toolCosts: string
    terms: string
    items: readonly PackageFacts[]
  }
  proof: {
    eyebrow: string
    heading: string
    body: string
    shots: readonly ProofShot[]
    ctaHeading: string
    cta: { href: string; label: string }
  }
}

export const DEFAULT_HOME_COPY: HomeCopy = {
  hero: heroCopy,
  film: filmCopy,
  turn: turnCopy,
  platter: platterCopy,
  steps: { ...stepsCopy, items: fallbackSteps },
  packages: { ...packagesCopy, items: homePackages },
  proof: proofCopy,
}

/** The text, unless it's missing or only spaces. */
function text(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

/**
 * Each row of a fixed list (the platter's six props, the film's three
 * chapters, the three proof shots) takes its words from the CMS row in the
 * same place; the rest of it stays as in code.
 */
function rows<T, R>(
  base: readonly T[],
  cms: readonly R[] | null | undefined,
  merge: (item: T, row: R | undefined) => T
): T[] {
  return base.map((item, index) => merge(item, cms?.[index]))
}

/** Package cards: code's facts, then the CMS package of the same tier. */
function packageItems(cms: readonly Package[]): PackageFacts[] {
  const byTier = new Map(cms.map((item) => [item.tier, item]))
  return homePackages.map((item) => {
    const row = byTier.get(item.tier)
    if (!row) return item
    return {
      ...item,
      name: text(row.name, item.name),
      price: row.price,
      turnaround: text(row.turnaround, item.turnaround),
      ctaLabel: text(row.ctaLabel, item.ctaLabel),
      highlight: row.highlight === true,
    }
  })
}

export interface HomeCms {
  homepage: Homepage | null
  packages: readonly Package[]
  toolCosts: string | null | undefined
}

export function homeCopyFrom({
  homepage,
  packages,
  toolCosts,
}: HomeCms): HomeCopy {
  const d = DEFAULT_HOME_COPY
  const hero = homepage?.hero
  const film = homepage?.film
  const turn = homepage?.turn
  const platter = homepage?.platter
  const steps = homepage?.steps
  const pkgs = homepage?.packages
  const proof = homepage?.proof
  const cmsSteps = (steps?.items ?? [])
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
    }))
    .filter((item) => item.title && item.description)
  return {
    hero: {
      ...d.hero,
      eyebrow: text(hero?.eyebrow, d.hero.eyebrow),
      lines: [
        text(hero?.line1, d.hero.lines[0] ?? ''),
        text(hero?.line2, d.hero.lines[1] ?? ''),
      ],
      lede: text(hero?.lede, d.hero.lede),
      primaryCta: {
        ...d.hero.primaryCta,
        label: text(hero?.primaryLabel, d.hero.primaryCta.label),
      },
      secondaryCta: {
        ...d.hero.secondaryCta,
        label: text(hero?.secondaryLabel, d.hero.secondaryCta.label),
      },
    },
    film: {
      title: text(film?.title, d.film.title),
      pinnedLine: text(film?.pinnedLine, d.film.pinnedLine),
      chapters: rows(d.film.chapters, film?.chapters, (item, row) => ({
        ...item,
        label: text(row?.label, item.label),
        body: text(row?.body, item.body),
      })),
    },
    turn: {
      heading: text(turn?.heading, d.turn.heading),
      body: text(turn?.body, d.turn.body),
      closing: text(turn?.closing, d.turn.closing),
    },
    platter: {
      eyebrow: text(platter?.eyebrow, d.platter.eyebrow),
      heading: text(platter?.heading, d.platter.heading),
      body: text(platter?.body, d.platter.body),
      note: text(platter?.note, d.platter.note),
      deliverables: rows(
        d.platter.deliverables,
        platter?.deliverables,
        (item, row) => ({
          name: text(row?.name, item.name),
          description: text(row?.description, item.description),
        })
      ),
    },
    steps: {
      heading: text(steps?.heading, d.steps.heading),
      note: text(steps?.note, d.steps.note),
      items: cmsSteps.length > 0 ? cmsSteps : d.steps.items,
    },
    packages: {
      eyebrow: text(pkgs?.eyebrow, d.packages.eyebrow),
      heading: text(pkgs?.heading, d.packages.heading),
      toolCosts: text(toolCosts, d.packages.toolCosts),
      terms: text(pkgs?.terms, d.packages.terms),
      items: packageItems(packages),
    },
    proof: {
      ...d.proof,
      eyebrow: text(proof?.eyebrow, d.proof.eyebrow),
      heading: text(proof?.heading, d.proof.heading),
      body: text(proof?.body, d.proof.body),
      shots: rows(d.proof.shots, proof?.shots, (item, row) => ({
        ...item,
        label: text(row?.label, item.label),
        caption: text(row?.caption, item.caption),
      })),
      ctaHeading: text(proof?.ctaHeading, d.proof.ctaHeading),
      cta: { ...d.proof.cta, label: text(proof?.ctaLabel, d.proof.cta.label) },
    },
  }
}
