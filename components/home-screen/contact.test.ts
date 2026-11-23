import { describe, expect, it } from 'bun:test'

import { contactLink, fillPage, pageName } from './contact'
import { HOME_SCREEN_DEFAULTS, homeScreenFrom } from './copy'

const contact = { phone: '+1 (945) 220-9222', email: 'hello@hnst.marketing' }
const bar = HOME_SCREEN_DEFAULTS.bar

describe('contact links', () => {
  it('rings the number with only digits and the plus', () => {
    expect(contactLink('call', 'Podcast', contact, bar)).toBe(
      'tel:+19452209222'
    )
  })

  it('writes the text for the page the visitor is on', () => {
    const href = contactLink('text', 'Podcast', contact, bar)
    expect(href.startsWith('sms:+19452209222?body=')).toBe(true)
    expect(decodeURIComponent(href.split('body=')[1] ?? '')).toBe(
      fillPage(bar.textMessage, 'Podcast')
    )
  })

  it('asks for a price by text, naming the offer', () => {
    const href = contactLink('price', 'Mobile Application', contact, bar)
    expect(decodeURIComponent(href)).toContain('a price for Mobile Application')
  })

  it('fills the email subject and body', () => {
    const href = contactLink('email', 'About', contact, bar)
    const url = new URL(href)
    expect(url.protocol).toBe('mailto:')
    expect(url.pathname).toBe('hello@hnst.marketing')
    expect(url.searchParams.get('subject')).toBe('About: hnst.marketing')
    expect(url.searchParams.get('body')).toContain('the About page')
  })
})

describe('home screen copy', () => {
  it('shows the defaults with no CMS, switched off', () => {
    const copy = homeScreenFrom(null)
    expect(copy.enabled).toBe(false)
    expect(copy.buttons).toHaveLength(4)
  })

  it('keeps good rows, drops broken ones and falls back on empty text', () => {
    const copy = homeScreenFrom({
      enabled: true,
      background: null,
      title: '  ',
      buttons: [
        { label: 'Podcast', href: '/podcast', style: 'headlines' },
        { label: '', href: '', style: 'headlines' },
      ],
    })
    expect(copy.enabled).toBe(true)
    expect(copy.background).toBe(HOME_SCREEN_DEFAULTS.background)
    expect(copy.title).toBe(HOME_SCREEN_DEFAULTS.title)
    expect(copy.buttons).toEqual([
      {
        label: 'Podcast',
        href: '/podcast',
        note: undefined,
        style: 'headlines',
        lines: [],
        handle: undefined,
      },
    ])
  })
})

describe('page names in messages', () => {
  const titles = [{ path: '/podcast', title: 'Podcast' }]
  it('names the page by its CMS title', () => {
    expect(pageName('/podcast/', titles)).toBe('Podcast')
    expect(pageName('/', titles)).toBe('home')
    expect(pageName('/somewhere', titles)).toBe('website')
  })
})
