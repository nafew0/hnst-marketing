# Phone layout

The iPhone-style layout under the `dt:` breakpoint (`docs/phases/PHONE.md`). It is off unless `NEXT_PUBLIC_PHONE_LAYOUT=1` (`flag.ts`), until M9. From 800 px up, nothing here renders, and the macOS windows and dock (`components/ui/window`) behave as before.

## How it fits together

| Piece                      | File                                  | What it does                                                                                                                  |
| -------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| App registry               | `registry.ts`                         | Every app: label, accessible name, grid or dock, what it opens, owner. Add an app here first.                                 |
| Settings shape             | `settings.ts`                         | The CMS fields Astra builds in M3, as a Zod schema, plus DRAFT copy. The loader (`load.ts`) returns the draft until M3 lands. |
| Home screen                | `home/`                               | Server-rendered over the homepage story on `/`, hidden without JavaScript. Lock screen, widgets, grid, dock.                  |
| App frame                  | `bars.tsx` + `components/ui/window`   | The P7W window in a phone skin: back, title, Privacy, home indicator. Home keeps the app in memory, like minimising.          |
| Zoom                       | `zoom.ts`                             | Apps grow out of their icon and shrink back into it. First frame before paint. None with reduced motion or at tier 0.         |
| Phone-only apps            | `only-route.tsx`                      | `/?app=<id>` opens Camera or Notes as a window over the home screen. On a direct visit, `/` is put under it in the history.   |
| Notifications              | `notifications/`                      | `notify(trigger, vars)`, the banners and the Notification Centre. Copy comes from settings.                                   |
| Icons                      | `components/ui/window/dock-icons.tsx` | `PhoneAppIcon({ id })`. The art is shared with the macOS dock; the gradients are server-rendered once in `WindowHost`.        |
| Building blocks            | `kit/`                                | What apps are built from (below).                                                                                             |
| Content pages' phone views | `view.tsx`                            | `<PhoneView phone={…}>{page content}</PhoneView>`: both server-rendered, CSS picks one.                                       |

## Building an app

1. Find your app in `registry.ts`. Its `owner` and `phase` say who builds it and when.
2. **Phone-only apps** (Camera, Notes) replace the placeholder in `components/apps/<id>/index.tsx`.
   **Content apps** add a phone view to their page with `PhoneView`, in both the direct page and the intercepted route.
3. Build the view from the kit. Don't restyle the frame; ask Claude for a missing piece.
4. Tell the visitor what happened with `notify()` where the brief says so, for example `notify('booking-confirmed', { time })`.

### The kit (`kit/`)

| Component                                  | Use                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `PhoneScreen`                              | An app's screen: the large title (the page's `<h1>`) and the phone's margins.                    |
| `GroupedList`, `ListRow`                   | iOS-style grouped rows. `ListRow` with `href` is a link with a chevron.                          |
| `Sheet`                                    | A bottom sheet (Base UI Drawer): swipe down, Done or Esc to close. Forms go inside.              |
| `Segmented`                                | One of a few options, always one chosen.                                                         |
| `EmptyState`, `LoadingState`, `ErrorState` | Nothing yet, waiting, or failed (with "Try again").                                              |
| Buttons                                    | `components/ui/button` as everywhere else: `gold` for the one main action, `ghost` for the rest. |

`/lab/phone` (noindex) shows each of them, every icon, and buttons that fire each notification.

### Rules that matter here

- **Visitor input stays in memory.** Form drafts, notes and photos never go into `localStorage`, `sessionStorage`, IndexedDB or cookies. The only flags stored hold no input: "lock screen seen" and, from M5, "classic view on".
- **Every gesture has a button.** Swipes start away from the screen edges, which iOS and Android own.
- **Reduced motion and tier 0:** no wallpaper video, no zoom, no sliding, and everything still works.
- **No Apple artwork, fonts or names.** The browser app is "Classic website"; Packages is never "App Store".

## Privacy choices

On phones, the home screen and lock screen cover the corner "Privacy choices" pill. Every phone surface therefore has its own Privacy control (the app bar, and the home screen's top row), so consent stays reachable.

## Decisions in M2 (6 Nov 2026)

- **Safe areas:** `viewport-fit=cover` stays off. In mobile Safari the page doesn't reach under the notch anyway, and turning it on would push every page's header under it in landscape. The phone surfaces still pad by `env(safe-area-inset-*)`, which is 0 until it's on. It can't be judged in emulation.
- **Direct visits on a phone** are a full-screen app frame (CSS only, so no-JS works): back, title and Privacy at the top, the page scrolling inside, the home indicator at the bottom. The header, footer and corner Privacy pill are covered, as an opened window covers them.
- **The window pane stays `tabindex="-1"`.** It takes focus when a window opens, so the arrow keys scroll it. `jsx-a11y/no-noninteractive-tabindex` forbids a Tab stop on it, and every real page has links. The CMS's empty "Page in preparation" fallback has nothing focusable, so axe flags `scrollable-region-focusable` there. A link on that fallback (Astra) would close it.
- **Duplicated HTML in `PhoneView`** is acceptable for content pages, but not for pages with forms. See `view.tsx`.
- **The lock screen** shows once a session and only on `/`. A small `beforeInteractive` script in the site layout hides it before paint for a returning session or a visit that started elsewhere; the flag it reads holds no visitor input.
