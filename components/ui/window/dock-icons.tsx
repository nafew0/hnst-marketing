'use client'

import { type ReactNode, useSyncExternalStore } from 'react'

import type { PhoneAppId } from '@/components/ui/phone/registry'

import s from './dock.module.css'

/**
 * The dock's app icons, drawn on a 100-unit grid. Shapes that macOS gets from
 * math come from math here too. Colours are the `dock-*` tokens in
 * `brand.config.ts`.
 */
const CENTRE = 50

function polar(radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180
  return [
    CENTRE + radius * Math.cos(angle),
    CENTRE + radius * Math.sin(angle),
  ] as const
}

function outline(points: readonly (readonly [number, number])[]) {
  const [first, ...rest] = points.map(
    ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`
  )
  return `M${first}L${rest.join('L')}Z`
}

/** The macOS icon outline: a superellipse, |x|⁵ + |y|⁵ = r⁵, not a rounded box. */
const SQUIRCLE = outline(
  Array.from({ length: 120 }, (_, index) => {
    const angle = (index / 120) * 2 * Math.PI
    const along = (value: number) =>
      Math.sign(value) * Math.abs(value) ** (2 / 5) * CENTRE
    return [
      CENTRE + along(Math.cos(angle)),
      CENTRE + along(Math.sin(angle)),
    ] as const
  })
)

/** Twelve teeth, each narrower at the tip than at the root. */
const GEAR = outline(
  Array.from({ length: 12 }, (_, tooth) => {
    const middle = tooth * 30
    return [
      polar(25, middle - 10),
      polar(33, middle - 5.5),
      polar(33, middle + 5.5),
      polar(25, middle + 10),
    ]
  }).flat()
)

/** A polar curve, r = 31 + 2.4 cos 12θ: the scalloped edge of a seal. */
const SEAL = outline(
  Array.from({ length: 144 }, (_, index) => {
    const degrees = index * 2.5
    const scallop = 2.4 * Math.cos((12 * degrees * Math.PI) / 180)
    return polar(31 + scallop, degrees)
  })
)

/** A ray star of alternating long and short points. */
const STAR = outline(
  Array.from({ length: 24 }, (_, index) => {
    const reach = [19, 2, 10, 2][index % 4] ?? 2
    const angle = ((index * 15 - 90) * Math.PI) / 180
    return [66 + reach * Math.cos(angle), 30 + reach * Math.sin(angle)] as const
  })
)

/** Tokens spelled out in full: Tailwind drops any it can't find written in the source. */
function Gradient({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <linearGradient id={`dock-${id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  )
}

/**
 * One set of gradients for every icon, for the dock and the phone home screen
 * alike. Zero-sized, not hidden: hiding breaks `url()`. Server-rendered, so
 * icons have their colours on first paint; the calendar's date fills in on
 * hydration.
 */
export function DockIconDefs() {
  return (
    <svg aria-hidden="true" focusable="false" className={s.defs}>
      <defs>
        <Gradient
          id="sky"
          from="var(--color-dock-sky-1)"
          to="var(--color-dock-sky-2)"
        />
        <Gradient
          id="amber"
          from="var(--color-dock-amber-1)"
          to="var(--color-dock-amber-2)"
        />
        <Gradient
          id="green"
          from="var(--color-dock-green-1)"
          to="var(--color-dock-green-2)"
        />
        <Gradient
          id="rose"
          from="var(--color-dock-rose-1)"
          to="var(--color-dock-rose-2)"
        />
        <Gradient
          id="graphite"
          from="var(--color-dock-graphite-1)"
          to="var(--color-dock-graphite-2)"
        />
        <Gradient
          id="indigo"
          from="var(--color-dock-indigo-1)"
          to="var(--color-dock-indigo-2)"
        />
        <Gradient
          id="paper"
          from="var(--color-dock-paper-1)"
          to="var(--color-dock-paper-2)"
        />
        <linearGradient id="dock-metal" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-gold-metal-1)" />
          <stop offset="0.55" stopColor="var(--color-gold-metal-3)" />
          <stop offset="1" stopColor="var(--color-gold-metal-4)" />
        </linearGradient>
        {/* The light across the top of every icon. */}
        <linearGradient id="dock-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--color-dock-paper-1)"
            stopOpacity="0.22"
          />
          <stop
            offset="0.5"
            stopColor="var(--color-dock-paper-1)"
            stopOpacity="0"
          />
        </linearGradient>
        <CalendarDate />
      </defs>
    </svg>
  )
}

function AppIcon({ tile, children }: { tile: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={s.icon}
    >
      <path d={SQUIRCLE} fill={`url(#dock-${tile})`} />
      <path d={SQUIRCLE} fill="url(#dock-sheen)" />
      <g className={s.mark}>{children}</g>
      <path
        d={SQUIRCLE}
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeOpacity="0.24"
        strokeWidth="0.8"
      />
    </svg>
  )
}

/** The site itself, like Finder: the brand's crescent and starburst. */
function HomeIcon() {
  return (
    <AppIcon tile="indigo">
      <path
        d="M58 25A30 30 0 1 1 25 62 25 25 0 0 0 58 25Z"
        fill="url(#dock-metal)"
      />
      <path d={STAR} fill="url(#dock-metal)" />
    </AppIcon>
  )
}

function PackagesIcon() {
  // A cube from a regular hexagon: radius 30, corners every 60°.
  const [top, right, lowerRight, bottom, lowerLeft, left] = [
    -90, -30, 30, 90, 150, 210,
  ].map((degrees) => polar(30, degrees).join(' '))
  const middle = `${CENTRE} ${CENTRE}`
  return (
    <AppIcon tile="amber">
      <path d={`M${top}L${right}L${middle}L${left}Z`} fill="url(#dock-paper)" />
      <path
        d={`M${left}L${middle}L${bottom}L${lowerLeft}Z`}
        fill="var(--color-dock-paper-1)"
        fillOpacity="0.82"
      />
      <path
        d={`M${right}L${lowerRight}L${bottom}L${middle}Z`}
        fill="var(--color-dock-paper-1)"
        fillOpacity="0.56"
      />
    </AppIcon>
  )
}

function SettingsIcon() {
  return (
    <AppIcon tile="graphite">
      <path d={GEAR} fill="url(#dock-paper)" />
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r="17"
        fill="var(--color-dock-graphite-2)"
      />
      <path
        d={[0, 60, 120]
          .map((degrees) => {
            const [x1, y1] = polar(17, degrees)
            const [x2, y2] = polar(17, degrees + 180)
            return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
          })
          .join('')}
        fill="none"
        stroke="var(--color-dock-paper-2)"
        strokeWidth="3.4"
      />
      <circle cx={CENTRE} cy={CENTRE} r="6.5" fill="url(#dock-paper)" />
    </AppIcon>
  )
}

function ProofIcon() {
  return (
    <AppIcon tile="green">
      <path d={SEAL} fill="url(#dock-paper)" />
      <path
        d="M37 51 46 60 64 40"
        fill="none"
        stroke="var(--color-dock-green-2)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7.5"
      />
    </AppIcon>
  )
}

/** Who's behind HONEST: a profile in the brand's gold, not a compass. */
function AboutIcon() {
  return (
    <AppIcon tile="indigo">
      <circle cx={CENTRE} cy="38" r="13" fill="url(#dock-metal)" />
      <path
        d="M24 77Q24 56 50 56T76 77Q76 80 73 80H27Q24 80 24 77Z"
        fill="url(#dock-metal)"
      />
    </AppIcon>
  )
}

function MarketerIcon() {
  return (
    <AppIcon tile="rose">
      <path
        d="M34 58 40 76Q41 79 44 79H49Q52 79 51 76L46 62Z"
        fill="var(--color-dock-paper-2)"
      />
      <path
        d="M27 42 58 27Q64 24 64 31V69Q64 76 58 73L27 58Q21 55 21 50T27 42Z"
        fill="url(#dock-paper)"
      />
      <path
        d="M71 41A13 13 0 0 1 71 59M78 33A24 24 0 0 1 78 67"
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </AppIcon>
  )
}

function ContactIcon() {
  return (
    <AppIcon tile="sky">
      <rect
        x="18"
        y="28"
        width="64"
        height="45"
        rx="7"
        fill="url(#dock-paper)"
      />
      <path
        d="M20 66 41 48M80 66 59 48"
        fill="none"
        stroke="var(--color-dock-paper-2)"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="M20 32 46 53Q50 56 54 53L80 32"
        fill="none"
        stroke="var(--color-dock-sky-2)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </AppIcon>
  )
}

const noChange = () => () => undefined
const todayOnServer = () => null
const todayHere = () => {
  const today = new Date()
  return `${today.toLocaleDateString('en-US', { weekday: 'short' })} ${today.getDate()}`
}

/**
 * Today's date for the calendar icon: the visitor's own, so blank in the
 * server's HTML (its date and time zone may differ) and filled in on
 * hydration. In the shared defs, outside every link, so it is never part of
 * an app's accessible name (axe: label-content-name-mismatch).
 */
function CalendarDate() {
  const today = useSyncExternalStore(noChange, todayHere, todayOnServer)
  const [weekday, day] = today?.split(' ') ?? []
  return (
    <>
      <text
        id="dock-weekday"
        x={CENTRE}
        y="31"
        textAnchor="middle"
        fontSize="20"
        fontWeight="600"
        fill="var(--color-dock-red)"
      >
        {weekday}
      </text>
      <text
        id="dock-day"
        x={CENTRE}
        y="77"
        textAnchor="middle"
        fontSize="50"
        fontWeight="400"
        fill="var(--color-dock-ink)"
      >
        {day}
      </text>
    </>
  )
}

/** Today's date, as a calendar icon shows it, drawn from the shared defs. */
function BookIcon() {
  return (
    <AppIcon tile="paper">
      <use href="#dock-weekday" />
      <use href="#dock-day" />
    </AppIcon>
  )
}

/** Anything without an icon of its own: a small window. */
function WindowIcon() {
  return (
    <AppIcon tile="graphite">
      <rect
        x="18"
        y="24"
        width="64"
        height="52"
        rx="7"
        fill="url(#dock-paper)"
      />
      <path
        d="M18 38V31Q18 24 25 24H75Q82 24 82 31V38Z"
        fill="var(--color-dock-graphite-2)"
      />
      <circle cx="27" cy="31" r="2.6" fill="var(--color-window-close)" />
      <circle cx="35" cy="31" r="2.6" fill="var(--color-window-minimise)" />
      <circle cx="43" cy="31" r="2.6" fill="var(--color-window-zoom)" />
    </AppIcon>
  )
}

/** The phone's Camera: our own body and a gold lens. */
function CameraIcon() {
  return (
    <AppIcon tile="graphite">
      <rect
        x="38"
        y="25"
        width="24"
        height="12"
        rx="4"
        fill="url(#dock-paper)"
      />
      <rect
        x="18"
        y="32"
        width="64"
        height="44"
        rx="9"
        fill="url(#dock-paper)"
      />
      <circle cx={CENTRE} cy="54" r="15" fill="var(--color-dock-graphite-2)" />
      <circle cx={CENTRE} cy="54" r="10" fill="url(#dock-metal)" />
      <circle
        cx="46"
        cy="50"
        r="3"
        fill="var(--color-dock-paper-1)"
        fillOpacity="0.7"
      />
      <circle cx="72" cy="41" r="3" fill="url(#dock-metal)" />
    </AppIcon>
  )
}

/** A ruled sheet with a gold pen. */
function NotesIcon() {
  return (
    <AppIcon tile="rose">
      <rect
        x="24"
        y="20"
        width="46"
        height="60"
        rx="6"
        fill="url(#dock-paper)"
      />
      <path
        d="M32 36H62M32 47H62M32 58H52"
        fill="none"
        stroke="var(--color-dock-graphite-1)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M58 74 78 44Q80 41 83 43T84 49L64 79 56 82Z"
        fill="url(#dock-metal)"
      />
    </AppIcon>
  )
}

/** The classic website: a globe, not a compass. */
function WebsiteIcon() {
  return (
    <AppIcon tile="sky">
      <g
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeLinecap="round"
        strokeWidth="3.4"
      >
        <circle cx={CENTRE} cy={CENTRE} r="27" />
        <ellipse cx={CENTRE} cy={CENTRE} rx="12" ry="27" />
        <path d="M23 50H77M27 37H73M27 63H73" />
      </g>
    </AppIcon>
  )
}

/** A photo of the brand's own world: night sky, gold sun, a dune. */
function PhotosIcon() {
  return (
    <AppIcon tile="amber">
      <rect
        x="18"
        y="24"
        width="64"
        height="52"
        rx="7"
        fill="url(#dock-paper)"
      />
      <rect
        x="23"
        y="29"
        width="54"
        height="42"
        rx="4"
        fill="url(#dock-indigo)"
      />
      <circle cx="62" cy="42" r="7" fill="url(#dock-metal)" />
      <path d="M23 71V62Q38 50 52 60T77 58V71Z" fill="url(#dock-metal)" />
    </AppIcon>
  )
}

function InstagramIcon() {
  return (
    <AppIcon tile="rose">
      <g fill="none" stroke="var(--color-dock-paper-1)" strokeWidth="5">
        <rect x="27" y="27" width="46" height="46" rx="13" />
        <circle cx={CENTRE} cy={CENTRE} r="11" />
      </g>
      <circle cx="62.5" cy="37.5" r="3.2" fill="var(--color-dock-paper-1)" />
    </AppIcon>
  )
}

function XIcon() {
  return (
    <AppIcon tile="graphite">
      <path d="M28 26H40L72 74H60Z" fill="var(--color-dock-paper-1)" />
      <path
        d="M69 27 54 44M46 56 31 73"
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </AppIcon>
  )
}

function YouTubeIcon() {
  return (
    <AppIcon tile="paper">
      <rect
        x="20"
        y="31"
        width="60"
        height="38"
        rx="12"
        fill="var(--color-dock-red)"
      />
      <path d="M44 40 61 50 44 60Z" fill="var(--color-dock-paper-1)" />
    </AppIcon>
  )
}

function TikTokIcon() {
  return (
    <AppIcon tile="graphite">
      <g
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeLinecap="round"
        strokeWidth="8"
      >
        <path d="M54 24V63" />
        <circle cx="43" cy="64" r="11" />
        <path d="M54 25Q57 37 70 39" />
      </g>
    </AppIcon>
  )
}

function LinkedInIcon() {
  return (
    <AppIcon tile="sky">
      <g fill="var(--color-dock-paper-1)">
        <circle cx="33" cy="31" r="6" />
        <rect x="28" y="42" width="10" height="32" rx="2" />
        <path d="M46 42H56V47Q60 41 67 41Q76 41 76 53V74H66V56Q66 50 61 50Q56 50 56 57V74H46Z" />
      </g>
    </AppIcon>
  )
}

/** Every app on the phone home screen, sharing the dock's art where it has one. */
export function PhoneAppIcon({ id }: { id: PhoneAppId }) {
  switch (id) {
    case 'honest':
      return <HomeIcon />
    case 'calendar':
      return <BookIcon />
    case 'camera':
      return <CameraIcon />
    case 'packages':
      return <PackagesIcon />
    case 'how-it-works':
      return <SettingsIcon />
    case 'about':
      return <AboutIcon />
    case 'marketer':
      return <MarketerIcon />
    case 'instagram':
      return <InstagramIcon />
    case 'x':
      return <XIcon />
    case 'youtube':
      return <YouTubeIcon />
    case 'tiktok':
      return <TikTokIcon />
    case 'linkedin':
      return <LinkedInIcon />
    case 'photos':
      return <PhotosIcon />
    case 'browser':
      return <WebsiteIcon />
    case 'notes':
      return <NotesIcon />
    case 'mail':
      return <ContactIcon />
  }
}

/** A package tier shares its parent's box. */
export function DockIcon({ href }: { href: string }) {
  if (href === '/') return <HomeIcon />
  if (href === '/packages' || href.startsWith('/packages/'))
    return <PackagesIcon />
  if (href === '/how-it-works') return <SettingsIcon />
  if (href === '/proof') return <ProofIcon />
  if (href === '/about') return <AboutIcon />
  if (href === '/the-honest-marketer') return <MarketerIcon />
  if (href === '/contact') return <ContactIcon />
  if (href === '/book') return <BookIcon />
  return <WindowIcon />
}
