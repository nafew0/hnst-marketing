import { describe, expect, it } from 'bun:test'

import { findHexColors, isScanned } from './check-colors'

describe('check:colors', () => {
  it('flags hex colours in code and CSS', () => {
    expect(findHexColors("const gold = '#c1b38d'")).toEqual([
      { line: 1, match: '#c1b38d' },
    ])
    expect(findHexColors('a { color: #fff; }')).toEqual([
      { line: 1, match: '#fff' },
    ])
    expect(findHexColors("fill: '#0e0e14cc'")).toEqual([
      { line: 1, match: '#0e0e14cc' },
    ])
  })

  it('ignores ids, HTML entities and the hex-ok escape hatch', () => {
    expect(findHexColors("href: '#facade-section'")).toEqual([])
    expect(findHexColors("const ref = '&#123;'")).toEqual([])
    expect(findHexColors("scrollTo('#add') // hex-ok")).toEqual([])
    expect(findHexColors("const tag = 'item#1'")).toEqual([])
  })

  it('skips hex values and issue references inside comments', () => {
    expect(findHexColors('// fixed in #393')).toEqual([])
    expect(findHexColors('/* surface (#f2f2f2) */ a { color: red; }')).toEqual(
      []
    )
    expect(findHexColors('/*\n#e4e4e4\n*/\nb { color: #fff; }')).toEqual([
      { line: 4, match: '#fff' },
    ])
    expect(findHexColors("const url = 'https://x.dev/#abc'")).toEqual([])
  })

  it('reports the right line number', () => {
    expect(findHexColors('ok\nok\ncolor: #b78f65')).toEqual([
      { line: 3, match: '#b78f65' },
    ])
  })

  it('exempts brand.config.ts, assets and non-code files', () => {
    expect(isScanned('brand.config.ts')).toBe(false)
    expect(isScanned('public/logo.svg')).toBe(false)
    expect(isScanned('README.md')).toBe(false)
    expect(isScanned('e2e/agent-readiness.e2e.ts')).toBe(false)
    expect(isScanned('lib/foo.test.ts')).toBe(false)
    expect(isScanned('components/ui/button/button.module.css')).toBe(true)
    expect(isScanned('lib/webgl/shaders/nebula.ts')).toBe(true)
  })
})
