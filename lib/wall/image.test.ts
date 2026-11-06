import { describe, expect, it } from 'bun:test'

import sharp from 'sharp'

import { WALL_MAX_EDGE } from '@/lib/contracts'

import { encodeWallPhoto, sniffWallImage } from './image'

describe('sniffWallImage', () => {
  it('reads JPEG, PNG and WebP from the bytes', async () => {
    const jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: 'red' },
    })
      .jpeg()
      .toBuffer()
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer()
    const webp = await sharp({
      create: { width: 8, height: 8, channels: 3, background: 'red' },
    })
      .webp()
      .toBuffer()
    expect(sniffWallImage(jpeg)).toBe('image/jpeg')
    expect(sniffWallImage(png)).toBe('image/png')
    expect(sniffWallImage(webp)).toBe('image/webp')
  })

  it('rejects a GIF and an AVIF brand', () => {
    expect(sniffWallImage(Buffer.from('GIF89a-not-a-photo'))).toBeNull()
    expect(sniffWallImage(ftyp('avif'))).toBeNull()
    expect(sniffWallImage(ftyp('heic'))).toBe('image/heic')
    expect(sniffWallImage(ftyp('mif1'))).toBe('image/heif')
  })
})

describe('encodeWallPhoto', () => {
  it('drops GPS EXIF and honours orientation', async () => {
    const jpeg = await sharp({
      create: {
        width: 40,
        height: 10,
        channels: 3,
        background: { r: 200, g: 20, b: 20 },
      },
    })
      .jpeg()
      .withExif({
        IFD0: { ImageDescription: 'visitor-secret' },
        IFD3: {
          GPSLatitudeRef: 'N',
          GPSLatitude: '41/1 24/1 12/1',
          GPSLongitudeRef: 'W',
          GPSLongitude: '2/1 10/1 0/1',
        },
      })
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const before = await sharp(jpeg).metadata()
    expect(before.exif?.toString('latin1')).toContain('visitor-secret')

    const encoded = await encodeWallPhoto(jpeg)
    const after = await sharp(encoded.data).metadata()
    expect(after.exif).toBeUndefined()
    expect(after.xmp).toBeUndefined()
    expect(after.icc).toBeUndefined()
    expect(after.orientation).toBeUndefined()
    expect(encoded.data.includes(Buffer.from('visitor-secret'))).toBe(false)
    expect(encoded.width).toBe(10)
    expect(encoded.height).toBe(40)
  })

  it('keeps the longest side at 1600 px', async () => {
    const wide = await sharp({
      create: { width: 3200, height: 100, channels: 3, background: 'red' },
    })
      .jpeg()
      .toBuffer()
    const encoded = await encodeWallPhoto(wide)
    expect(encoded.width).toBe(WALL_MAX_EDGE)
    expect(encoded.height).toBeLessThanOrEqual(WALL_MAX_EDGE)
  })

  it('refuses a truncated HEIC', async () => {
    await expect(encodeWallPhoto(ftyp('heic'))).rejects.toThrow(
      'Not a JPEG, PNG, WebP or HEIC photo'
    )
  })
})

function ftyp(brand: string): Buffer {
  const body = Buffer.concat([
    Buffer.from('ftyp'),
    Buffer.from(brand),
    Buffer.alloc(4),
  ])
  const size = Buffer.alloc(4)
  size.writeUInt32BE(body.length + 4)
  return Buffer.concat([size, body])
}
