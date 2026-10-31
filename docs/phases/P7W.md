# P7W: Page windows (owner: Claude, Wave 3, about 3 days, rough estimate)

> Paste `docs/RULES.md` and then this file as the first message in the coder's session. Before coding, read `AGENTS.md` (binding engineering rules) and `docs/PLAN.md` § Satus adaptations, which overrides anything older.

> **Decision (Nafew, 30 Oct 2026).** The site's main pages open as macOS-style windows on top of the current page. Clicking the red button closes a window, yellow minimises it and green makes it full screen. Everything else about the pages stays as briefed. Nothing has been prototyped yet, so step 1 tests the riskiest assumptions before the rest is built.

**Depends on:** P3 and P7 (merged), and P6 task 0 (each main page's content split from its route). Build against `/packages` and `/contact` first; P6 pages join as they land.

**Files owned:** `components/ui/window/**`, `app/(site)/@window/**`, `e2e/windows.e2e.ts`, and the slot in `app/(site)/layout.tsx`. Also the canvas pause in `components/three/**`, the Lenis pause on the homepage and the window colours in `brand.config.ts`. In each main page's `page.tsx`, change only the shell (P6 owns the rest of the file).

## Which pages

| Opens as a window                                                                                                 | Stays a plain page                                                           |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/packages`, `/packages/[tier]`, `/how-it-works`, `/proof`, `/about`, `/the-honest-marketer`, `/book`, `/contact` | `/`, `/thanks/*`, `/legal/*`, `/link-in-bio`, `/ai`, `/lab/*`, `/admin`, 404 |

## Behaviour

**Opening.** A normal link click on any page opens the window over that page, using Next's parallel and intercepting routes. The URL changes to the page's real URL. The page underneath keeps its scroll position.

**Only one window is visible at a time.** A link inside a window replaces that window's content. A link to a plain page, such as `/thanks/booking` after a form succeeds, leaves the window and shows that page. Don't build dragging, resizing or overlapping windows: nobody asked for them.

**Closing is deliberate.** Clicking outside a window does not close it. The window is modal, and the page behind is inert, including the header.

| Control      | Result                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red          | Closes the window and returns to the page it opened over, at the same scroll position                                                                          |
| Esc          | Same as red. Required for keyboard users. A lightbox or menu inside the window closes first                                                                    |
| Browser Back | From the first window, closes it. Inside a window, steps back through its pages                                                                                |
| Yellow       | Funnels the window into its dock icon (the genie), then returns to the page underneath                                                                         |
| Dock icon    | Restores a minimised window as it was, including scroll and half-filled forms. It can also be dismissed with a × on hover; on phones, restore it and press red |
| Green        | Toggles between the normal window and filling the browser window. This is not the browser's Fullscreen API                                                     |

**The dock** (Nafew, 31 Oct 2026) is always there, like the macOS Dock: one vector app icon per main page on a glass bar, with magnification on hover and a dot under anything running. Clicking another icon keeps the current window as it is, behind. Anything else open, such as a package tier, gets its own icon past a divider. Green full screen hides the dock. It must not cover the "Privacy choices" control. Running windows last for the visit and clear on a full reload. Tier 0 and reduced motion skip the genie.

**Minimised state lives in memory only.** Never write visitors' form values to `localStorage` or `sessionStorage`. Tick boxes keep what the visitor chose, and consent is never ticked on their behalf.

**Direct visits, refreshes, crawlers and no-JS** get the complete page server-rendered at its real URL, with `Header`, `Footer`, `<main>` and normal page scrolling. It sits in the window frame over a static CSS or poster background, with no live 3D. Here red goes to `/`, and yellow goes to `/`, leaving the window in its dock icon. This is what Lighthouse and search engines see.

**Phones (under the `dt:` breakpoint)** always use the full-screen form. Keep the three controls, with larger tap targets. Green is hidden because it has nothing to do there.

## Look

- A dark title bar in the brand's `void` surfaces, the page's title centred, and the three dots at the left in Mac order: red, yellow, green.
- Add the three colours as named tokens in `brand.config.ts`, then run `bun run setup:styles`. Never use literals. They are the one deliberate addition to the palette, and the Founder may tune them.
- A soft backdrop dim, a thin border and a large shadow. Use no Apple icons, wallpaper, fonts or logos.
- Default size: wide enough for content at `max-w-[1100px]`, with a visible margin all round. Content must also hold up in a window about 900 px wide, because `dt:` responds to the viewport, not the window.
- Satus resets Tailwind's spacing, radius and font-weight scales. Use `dr-*` utilities or arbitrary values, and check the results in a screenshot.

## Accessibility

- Use Base UI's `Dialog` (`@base-ui/react/dialog`), labelled by the page title. Move focus into the window on opening and return it to the triggering link on closing, or to a sensible element if that link has gone.
- Each dot has a hit area of at least 24×24 px on desktop and 44×44 px on phones, however small it looks.
- Names: "Close window", "Minimise window", "Enter full screen" and "Exit full screen". Dock icons: the page's name, or "Restore {title}" while minimised.
- Colour can't be the only signal. Show each dot's symbol on hover and keyboard focus, and always on touch screens. Focus rings must be visible, and each dot needs 3:1 contrast against the title bar.
- The page's `<h1>` stays in the content. The title bar's text isn't a heading.
- Announce the new page. `document.title` must update for intercepted routes as well.

## Motion and performance

- Open and close with a short CSS transform and opacity transition or the existing anime.js layer. No GSAP, Framer Motion or genie effect. Reduced motion and tier 0 get no animation, but the windows still work.
- While a window is open, pause the homepage: call Lenis `stop()` (and `start()` on close), mark the window's scroller `data-lenis-prevent`, and stop `ViewportScene` drawing. The canvas keeps its last frame.
- Load the window and dialog code lazily, as the header does with its drawer, so it isn't in the first load of `/`.
- Record Lighthouse for `/`, `/packages` and `/contact` on a quiet machine before starting. CI on `fbf7365` measured 0.77 on `/`, and 0.88 and 0.92 on the other two, on GitHub runners. Windows must not make these worse. P10 owns getting `/` to target.

## Build order

1. **Test the risky parts first, on `/contact` and `/packages`, and report back before continuing:**
   - Does a form's state survive minimise and restore, given that a parallel route's content can unmount when the URL changes? Keep the content mounted, for example with React's `<Activity>`, if that works cleanly. Otherwise hold drafts in an in-memory store, and say which you chose and why.
   - Does `(.)` interception work from every page, including from inside a window and from `[...slug]`?
   - Does red return to the right page after moving between several windows, and does Back behave as the table says?
   - Does a `/proof` lightbox stack correctly inside the window, with Esc closing only the lightbox?
2. The window frame and its three controls, on the two pages.
3. The dock.
4. The direct-visit form.
5. The homepage pause.
6. Add each P6 page as it lands. Each should need only one intercept file and a shell change.

## Acceptance criteria

`e2e/windows.e2e.ts` covers these, in Chromium, WebKit and mobile emulation:

- Every page in the table opens as a window from `/` and from `/packages`, with the correct URL and `document.title`.
- Red, Esc and Back return to the original page at its original scroll position. A click outside does nothing.
- A half-filled `/contact` form survives minimise and restore, and nothing was written to browser storage. A form that succeeds lands on `/thanks/*` with the window gone.
- Tab stays inside the window, focus returns on close, and a keyboard alone can use all three controls and the dock.
- Axe finds no serious or critical issues with a window open, minimised and full screen, at desktop and phone sizes.
- With JavaScript disabled, each main page loads complete at its own URL. Its metadata, canonical and JSON-LD are unchanged.
- `gl.clear` isn't called while a window is open over `/` (reuse the approach in `render-on-demand.e2e.ts`), and drawing resumes after closing.
- With reduced motion, nothing animates, and everything still works.
- Lighthouse is no worse than the recorded baseline, and direct visits to main pages reach at least 95 for performance and accessibility on a quiet machine.
- Screenshots of each state at desktop and phone sizes are attached to the PR. Tests alone missed a site-wide styling break in P3.

## Not in scope

- Dragging, resizing, or several visible windows.
- Changing any page's content, forms or API use.
- Claiming a real-device or screen-reader pass unless one was actually performed.
