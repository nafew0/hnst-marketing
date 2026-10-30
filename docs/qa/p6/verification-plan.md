# P6 verification plan

Base: main `d7f704f`, containing P5, task 0 and the calendar CSP update.

Failure modes to exercise before acceptance:

- Draft pages, FAQs and settings must not leak through public reads or anonymous draft queries. Preview requires an admin/editor; the experience figure remains absent.
- Missing photos, proof and eBook remain labelled placeholders. A real gallery item opens a Base UI dialog, traps focus, closes with Escape and restores focus.
- Booking detects timezone, pages availability within the frozen 31-day limit and ignores stale responses after timezone/month changes.
- 201 produces confirmed calendar exports. 202 produces pending status with no calendar links. A direct thank-you visit must not invent a booking.
- A 409 clears the stale slot and refreshes availability. An uncertain retry retains its key; changed visitor input starts a new logical submission. Pending and duplicate submits cannot create a second logical booking.
- Phone and both consent choices are optional; SMS opt-in requires a phone and transmits the exact displayed wording. Analytics must respect consent and withdrawal.
- API availability failure shows the configured calendar embed. Check the real embed in the site without submitting or choosing a live appointment; keep its address out of tracked files and screenshots.
- Magnet signup uses the contract client and reaches the CMS-backed email-delivery thank-you page.
- Audit all new pages and changed package pages in the production build, with desktop, phone, 900 px, keyboard, reduced motion, no-JS, axe and screenshots. Run the whole repository browser suite and report baseline failures separately.
