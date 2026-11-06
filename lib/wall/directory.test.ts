import { describe, expect, it } from 'bun:test'
import path from 'node:path'

import { isSafeWallFilename, resolveWallDirectory } from './directory'

describe('resolveWallDirectory', () => {
  it('defaults outside public/', () => {
    expect(resolveWallDirectory(undefined, '/tmp/site')).toBe(
      path.resolve('/tmp/site/.data/wall')
    )
    expect(resolveWallDirectory('/var/wall', '/tmp/site')).toBe('/var/wall')
  })

  it('refuses a directory inside public/', () => {
    expect(() => resolveWallDirectory('public/photos', '/tmp/site')).toThrow(
      'outside public'
    )
    expect(() => resolveWallDirectory('/tmp/site/public', '/tmp/site')).toThrow(
      'outside public'
    )
  })
})

describe('isSafeWallFilename', () => {
  it('accepts a basename and rejects a path', () => {
    expect(isSafeWallFilename('photo.webp')).toBe(true)
    expect(isSafeWallFilename('uuid-400x225.webp')).toBe(true)
    expect(isSafeWallFilename('../photo.webp')).toBe(false)
    expect(isSafeWallFilename('a photo.webp')).toBe(false)
  })
})
