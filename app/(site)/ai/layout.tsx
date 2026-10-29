import type { PropsWithChildren } from 'react'

/**
 * Own layout for the machine view: no `<Wrapper>`, header, footer, WebGL
 * canvas or client components, so an agent gets the entity and every link in
 * the first byte.
 *
 * Not provider-free: the route sits in the `(site)` group and inherits the
 * providers, analytics and RAF loop from `app/(site)/layout.tsx`. To make it
 * runtime-free, move it out of the group (root `app/layout.tsx` is a bare
 * shell).
 *
 * The Organization/WebSite JSON-LD graph already renders from
 * `app/(site)/layout.tsx`; do not re-render it here (duplicate `@id` nodes).
 * If the route leaves `(site)`, it must render the graph itself.
 *
 * `font-mono` resolves to the project's mono font (`--next-font-mono`, see
 * `lib/styles/fonts.ts`), not the Tailwind default stack.
 */
export default function AiLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto min-h-dvh dr-max-w-768 dr-px-24 dr-py-64 caption font-mono">
      {/* Skip-link target; this route bypasses <Wrapper>, which normally provides the id. */}
      <main id="main-content">{children}</main>
    </div>
  )
}
