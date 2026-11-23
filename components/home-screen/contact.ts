import type { SiteContact } from '@/components/ui/phone/registry'

import type { HomeScreenCopy } from './copy'

/** What a contact button does: ring, text or email Dylan, or ask for a price. */
export type ContactKind = 'call' | 'text' | 'email' | 'price'

/** The page the visitor is on, in the words a message names it by. */
export function fillPage(template: string, page: string) {
  return template.replaceAll('{page}', page)
}

/**
 * The link that opens the visitor's own Phone, Messages or Mail, with the
 * message already written. "Get a Price" is a text: it is the quickest way to
 * reach Dylan, and phones without a SIM fall back to the email button beside it.
 */
export function contactLink(
  kind: ContactKind,
  page: string,
  contact: SiteContact,
  bar: HomeScreenCopy['bar']
) {
  // Only digits and a leading plus survive in tel: and sms: links.
  const number = contact.phone.replaceAll(/[^\d+]/gu, '')
  const query = (fields: Record<string, string>) =>
    Object.entries(fields)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
  switch (kind) {
    case 'call':
      return `tel:${number}`
    case 'text':
      return `sms:${number}?${query({ body: fillPage(bar.textMessage, page) })}`
    case 'price':
      return `sms:${number}?${query({ body: fillPage(bar.priceMessage, page) })}`
    case 'email':
      return `mailto:${contact.email}?${query({
        subject: fillPage(bar.emailSubject, page),
        body: fillPage(bar.emailBody, page),
      })}`
  }
}

export interface PageTitle {
  path: string
  title: string
}

/** How a message names where the visitor is: the page's title, or "home". */
export function pageName(pathname: string, titles: readonly PageTitle[]) {
  const path = pathname.replace(/\/+$/u, '') || '/'
  if (path === '/') return 'home'
  return titles.find((page) => page.path === path)?.title ?? 'website'
}
