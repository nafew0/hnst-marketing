'use client'

import { type ReactNode, useState } from 'react'

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

/** Compass marks every 15°, longer on the 45s. */
const TICKS = Array.from({ length: 24 }, (_, index) => {
  const degrees = index * 15
  const [x1, y1] = polar(index % 3 === 0 ? 29 : 31.5, degrees)
  const [x2, y2] = polar(34.5, degrees)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`
}).join('')

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

/** One set of gradients for every icon. Zero-sized, not hidden: hiding breaks `url()`. */
export function DockIconDefs() {
  const [today] = useState(() => new Date())
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
        {/* Here, not in the link: the date isn't part of the icon's name, "Book a call". */}
        <text
          id="dock-weekday"
          x={CENTRE}
          y="31"
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          fill="var(--color-dock-red)"
        >
          {today.toLocaleDateString('en-US', { weekday: 'short' })}
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
          {today.getDate()}
        </text>
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

function AboutIcon() {
  return (
    <AppIcon tile="paper">
      <circle cx={CENTRE} cy={CENTRE} r="37" fill="url(#dock-sky)" />
      <path
        d={TICKS}
        fill="none"
        stroke="var(--color-dock-paper-1)"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <g transform="rotate(42 50 50)">
        <path d="M50 20 56 50H44Z" fill="var(--color-dock-red)" />
        <path d="M50 80 56 50H44Z" fill="var(--color-dock-paper-1)" />
      </g>
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

/** Today's date, as the macOS Calendar icon shows it. */
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
