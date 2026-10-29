/**
 * anime.js loads after hydration instead of with the page: a static import
 * puts the whole library in the initial JS of every route that animates.
 * Module-level because React Compiler cannot compile a component that
 * contains an `import()` expression (same pattern as
 * components/effects/progress-text).
 */
export const loadAnime = () => import('animejs')

export type Anime = Awaited<ReturnType<typeof loadAnime>>
