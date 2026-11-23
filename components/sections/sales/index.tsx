import { ScrollArea } from '@base-ui/react/scroll-area'
import cn from 'clsx'
import type { ReactNode } from 'react'

import { type ContactKind, contactLink } from '@/components/home-screen/contact'
import type { HomeScreenCopy } from '@/components/home-screen/copy'
import { Button } from '@/components/ui/button'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import type { SiteContact } from '@/components/ui/phone/registry'
import { Container, Section } from '@/components/ui/section'
import { WorldHero } from '@/components/world'
import { WorldScene } from '@/components/world/scene'
import type { WorldClip } from '@/components/world/worlds'
import type { Page } from '@/lib/cms/payload-types'

import w from '@/components/world/world.module.css'

type Block = NonNullable<Page['blocks']>[number]
type SalesBlockType = Extract<
  Block,
  {
    blockType: 'salesHero' | 'salesSection' | 'objections' | 'offerComparison'
  }
>
type Action = NonNullable<SalesBlockType['actions']>[number]
type Group = NonNullable<
  Extract<Block, { blockType: 'salesSection' }>['groups']
>[number]

const SALES = new Set<string>([
  'salesHero',
  'salesSection',
  'objections',
  'offerComparison',
])

export function isSalesBlock(block: Block): block is SalesBlockType {
  return SALES.has(block.blockType)
}

/** What Call, Text, Email and Get a Price need: who, and the words. */
export interface SalesContext {
  /** The page's name in the messages, e.g. "Podcast". */
  page: string
  contact: SiteContact
  bar: HomeScreenCopy['bar']
  clips: { hero: WorldClip; closing: WorldClip }
}

/** A blank line starts a new paragraph. */
function Paragraphs({
  text,
  className,
}: {
  text: string | null | undefined
  className: string
}) {
  const parts = (text ?? '')
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.map((part) => (
    <p key={part} className={className}>
      {part}
    </p>
  ))
}

function Actions({
  actions,
  context,
  large = false,
}: {
  actions: readonly Action[] | null | undefined
  context: SalesContext
  large?: boolean
}) {
  if (!actions?.length) return null
  const word = {
    call: context.bar.call,
    text: context.bar.text,
    email: context.bar.email,
    price: context.bar.price,
  } satisfies Record<ContactKind, string>
  return (
    <div className="flex flex-wrap dr-gap-12">
      {actions.map((action, index) => {
        const href =
          action.kind === 'link'
            ? (action.href ?? '/')
            : contactLink(
                action.kind,
                context.page,
                context.contact,
                context.bar
              )
        const label =
          action.label?.trim() ||
          (action.kind === 'link' ? 'More' : word[action.kind])
        return (
          <Button
            key={action.id ?? `${action.kind}${index}`}
            href={href}
            variant={action.kind === 'call' ? 'gold' : 'ghost'}
            size={large ? 'lg' : 'md'}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}

const MARKS = new Map<Group['style'], string>([
  ['yes', '✓'],
  ['no', '✕'],
  ['list', '—'],
])

function ItemText({ item }: { item: NonNullable<Group['items']>[number] }) {
  return (
    <>
      {item.title && (
        <p className="p-big font-[600] text-balance">{item.title}</p>
      )}
      {item.text && (
        <Paragraphs text={item.text} className="p text-pretty text-silver" />
      )}
    </>
  )
}

function GroupList({ group }: { group: Group }) {
  const items = group.items ?? []
  switch (group.style) {
    case 'tags':
      return (
        <ul className="flex flex-wrap dr-gap-8">
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className="rounded-[999px] border border-gold/40 dr-px-16 dr-py-8 caption text-starlight"
            >
              {item.title ?? item.text}
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="grid dr-gap-16">
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className="grid grid-cols-[auto_1fr] items-start dr-gap-16 border-b border-gold/20 dr-pb-16 last:border-b-0"
            >
              <span className="h3 text-gold tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col dr-gap-8">
                <ItemText item={item} />
              </div>
            </li>
          ))}
        </ol>
      )
    case 'list':
    case 'yes':
    case 'no':
      return (
        <ul className="flex flex-col dr-gap-12">
          {items.map((item, index) => (
            <li key={item.id ?? index} className="flex items-start dr-gap-12">
              <span
                aria-hidden="true"
                className={cn(
                  'shrink-0 dr-pt-4 font-[700]',
                  group.style === 'no' ? 'text-silver' : 'text-gold'
                )}
              >
                {MARKS.get(group.style)}
              </span>
              <div className="flex flex-col dr-gap-4">
                <ItemText item={item} />
              </div>
            </li>
          ))}
        </ul>
      )
    case 'placeholders':
      return (
        <ul className="grid dr-gap-12 dt:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className="flex min-h-[120px] flex-col justify-center rounded-[16px] border border-dashed border-gold/40 dr-p-24 text-center"
            >
              <ItemText item={item} />
            </li>
          ))}
        </ul>
      )
    case 'apps':
      return (
        <ul className="grid dr-gap-16 dt:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className="flex flex-col dr-gap-12 rounded-[16px] border border-gold/30 bg-void-2 dr-p-24"
            >
              {item.stat && (
                <p className="h2 text-gold tabular-nums">
                  {item.stat}
                  {item.statLabel && (
                    <span className="block caption text-silver">
                      {item.statLabel}
                    </span>
                  )}
                </p>
              )}
              <ItemText item={item} />
              {item.url && (
                <Link
                  href={item.url}
                  newTab
                  className="mt-auto caption text-gold underline underline-offset-4"
                >
                  {new URL(item.url).host}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )
    case 'statements':
      return (
        <ul className="grid dr-gap-16 dt:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className="flex flex-col dr-gap-8 border-t border-gold/50 dr-pt-16"
            >
              <ItemText item={item} />
            </li>
          ))}
        </ul>
      )
    default:
      return (
        <ul
          className={cn(
            'grid dr-gap-16',
            group.style === 'panel' ? '' : 'dt:grid-cols-2'
          )}
        >
          {items.map((item, index) => (
            <li
              key={item.id ?? index}
              className={cn(
                'flex flex-col dr-gap-8',
                group.style === 'panel'
                  ? ''
                  : 'rounded-[16px] border border-gold/25 bg-void-2 dr-p-24'
              )}
            >
              <ItemText item={item} />
            </li>
          ))}
        </ul>
      )
  }
}

function GroupBlock({ group }: { group: Group }) {
  const panel = group.style === 'panel'
  return (
    <div
      className={cn(
        'flex flex-col dr-gap-16',
        panel && 'rounded-[16px] border border-gold/60 bg-gold/8 dr-p-32'
      )}
    >
      {group.heading && (
        <Heading as="h3" size="h3">
          {group.heading}
        </Heading>
      )}
      {group.intro && (
        <Paragraphs text={group.intro} className="p text-pretty text-silver" />
      )}
      <GroupList group={group} />
      {group.sampleFigures && (
        <p className="caption text-silver">
          Sample figures, shown until the real ones are in.
        </p>
      )}
    </div>
  )
}

/** "For you" and "not for you" side by side; every other list on its own row. */
function Groups({ groups }: { groups: readonly Group[] }) {
  const rows: Group[][] = []
  for (const group of groups) {
    const last = rows.at(-1)
    const pair = (style: Group['style']) => style === 'yes' || style === 'no'
    if (
      last?.length === 1 &&
      last[0] &&
      pair(last[0].style) &&
      pair(group.style)
    )
      last.push(group)
    else rows.push([group])
  }
  return rows.map((row) => (
    <div
      key={row.map((group) => group.id ?? group.heading).join()}
      className={cn('grid dr-gap-32', row.length > 1 && 'dt:grid-cols-2')}
    >
      {row.map((group, index) => (
        <GroupBlock key={group.id ?? index} group={group} />
      ))}
    </div>
  ))
}

function SectionHead({
  eyebrow,
  title,
  subheadline,
}: {
  eyebrow?: string | null | undefined
  title: string
  subheadline?: string | null | undefined
}) {
  return (
    <div className="flex max-w-[60ch] flex-col dr-gap-12">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading className="text-balance">{title}</Heading>
      {subheadline && (
        <p className="p-big text-pretty text-silver">{subheadline}</p>
      )}
    </div>
  )
}

function Closing({
  closing,
  children,
}: {
  closing?: string | null | undefined
  children?: ReactNode
}) {
  if (!closing && !children) return null
  return (
    <div className="flex flex-col dr-gap-16">
      {closing && <p className="p-big text-balance text-gold">{closing}</p>}
      {children}
    </div>
  )
}

/** The high-end offers' sections (lib/cms/sales-blocks.ts). */
export function SalesBlock({
  block,
  context,
}: {
  block: SalesBlockType
  context: SalesContext
}) {
  switch (block.blockType) {
    case 'salesHero':
      return (
        <WorldHero
          clip={context.clips.hero}
          title={block.title}
          eyebrow={block.badge}
          description={block.subheadline}
        >
          <div className="dr-mt-24 flex max-w-[64ch] flex-col dr-gap-16">
            <Paragraphs text={block.body} className="p text-pretty" />
          </div>
          {block.points?.length ? (
            <ul className="dr-mt-24 grid dr-gap-12 dt:grid-cols-3">
              {block.points.map((point, index) => (
                <li
                  key={point.id ?? index}
                  className="rounded-[14px] border border-gold/30 bg-void-deep/60 dr-p-16"
                >
                  <p className="p font-[600] text-gold">{point.title}</p>
                  {point.text && (
                    <p className="caption text-silver">{point.text}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="dr-mt-32">
            <Actions actions={block.actions} context={context} large />
          </div>
        </WorldHero>
      )
    case 'salesSection': {
      const topic = block.topic?.trim()
      const named = topic ? { ...context, page: topic } : context
      if (block.closingStyle)
        return (
          <section id={block.anchor ?? undefined} className={w.closing}>
            <WorldScene clip={context.clips.closing} />
            <div className={w.closingScrim} aria-hidden="true" />
            <Container className={cn(w.closingCopy, 'flex flex-col dr-gap-24')}>
              {block.eyebrow && <Eyebrow>{block.eyebrow}</Eyebrow>}
              <Heading className="text-balance">{block.title}</Heading>
              {block.subheadline && (
                <p className="p-big text-pretty">{block.subheadline}</p>
              )}
              <Paragraphs
                text={block.body}
                className="max-w-[60ch] p text-pretty"
              />
              <Closing closing={block.closing} />
              <Actions actions={block.actions} context={named} large />
            </Container>
          </section>
        )
      return (
        <Section id={block.anchor ?? undefined}>
          <Container className="flex flex-col dr-gap-32">
            <SectionHead
              eyebrow={block.eyebrow}
              title={block.title}
              subheadline={block.subheadline}
            />
            {block.body && (
              <div className="flex max-w-[68ch] flex-col dr-gap-16">
                <Paragraphs text={block.body} className="p text-pretty" />
              </div>
            )}
            <Groups groups={block.groups ?? []} />
            {block.note && (
              <p className="max-w-[72ch] caption text-silver">{block.note}</p>
            )}
            <Closing closing={block.closing}>
              <Actions actions={block.actions} context={named} />
            </Closing>
          </Container>
        </Section>
      )
    }
    case 'objections':
      return (
        <Section id={block.anchor ?? undefined}>
          <Container className="flex flex-col dr-gap-32">
            <SectionHead title={block.title} subheadline={block.subheadline} />
            <div className="rounded-[16px] border border-gold/25 bg-void-2 dr-px-32 dr-py-8">
              {block.items?.map((item, index) => (
                <details
                  key={item.id ?? index}
                  className="border-b border-gold/20 dr-py-24 last:border-b-0"
                  open={index === 0}
                >
                  <summary className="cursor-pointer p-big text-balance">
                    {item.question}
                  </summary>
                  <div className="flex flex-col dr-gap-12 dr-pt-16">
                    <Paragraphs
                      text={item.answer}
                      className="p text-pretty text-silver"
                    />
                  </div>
                </details>
              ))}
            </div>
            <Closing closing={block.closing}>
              <Actions actions={block.actions} context={context} />
            </Closing>
          </Container>
        </Section>
      )
    case 'offerComparison': {
      const columns = block.columns ?? []
      return (
        <Section id={block.anchor ?? undefined}>
          <Container className="flex flex-col dr-gap-32">
            <SectionHead title={block.title} subheadline={block.subheadline} />
            {/* Scrolls sideways on a phone rather than squeezing three offers. */}
            <ScrollArea.Root className="min-w-0 overflow-hidden rounded-[16px] border border-gold/25">
              <ScrollArea.Viewport
                role="region"
                aria-label={block.title}
                className="w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th scope="col" className="dr-p-16">
                        <span className="sr-only">{block.title}</span>
                      </th>
                      {columns.map((column, index) => (
                        <th
                          key={column.id ?? index}
                          scope="col"
                          className="dr-p-16 align-bottom"
                        >
                          {column.badge && (
                            <span className="dr-mb-8 block w-fit rounded-[999px] bg-gold dr-px-12 dr-py-4 caption font-[700] text-void uppercase">
                              {column.badge}
                            </span>
                          )}
                          <span className="p-big">{column.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows?.map((row, index) => (
                      <tr
                        key={row.id ?? index}
                        className="border-t border-gold/20"
                      >
                        <th
                          scope="row"
                          className="dr-p-16 align-top caption text-gold uppercase"
                        >
                          {row.label}
                        </th>
                        {columns.map((column, cell) => (
                          <td
                            key={column.id ?? cell}
                            className="dr-p-16 align-top p text-silver"
                          >
                            {row.cells?.[cell]?.text}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea.Viewport>
            </ScrollArea.Root>
            {block.note && <p className="caption text-silver">{block.note}</p>}
            <Actions actions={block.actions} context={context} />
          </Container>
        </Section>
      )
    }
  }
}
