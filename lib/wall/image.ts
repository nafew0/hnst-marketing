import sharp from 'sharp'

import { WALL_MAX_EDGE } from '@/lib/contracts'

const JPEG = [0xff, 0xd8, 0xff]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const HEIC_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
])
const HEIF_BRANDS = new Set(['mif1', 'msf1'])
const REJECTED_BRANDS = new Set(['avif', 'avis'])

export type WallImageType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'image/heif'

export class WallImageError extends Error {
  constructor() {
    super('Not a JPEG, PNG, WebP or HEIC photo')
    this.name = 'WallImageError'
  }
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false
  return signature.every((byte, index) => bytes[index] === byte)
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length))
}

function brandsOf(bytes: Uint8Array): string[] {
  if (bytes.length < 16 || ascii(bytes, 4, 4) !== 'ftyp') return []
  const brands = [ascii(bytes, 8, 4)]
  const end = Math.min(bytes.length, 64)
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    brands.push(ascii(bytes, offset, 4))
  }
  return brands
}

/** Judges the type from the bytes. The multipart Content-Type is ignored. */
export function sniffWallImage(bytes: Uint8Array): WallImageType | null {
  if (startsWith(bytes, JPEG)) return 'image/jpeg'
  if (startsWith(bytes, PNG)) return 'image/png'
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === 'RIFF' &&
    ascii(bytes, 8, 4) === 'WEBP'
  ) {
    return 'image/webp'
  }
  const brands = brandsOf(bytes)
  if (
    brands.length === 0 ||
    brands.some((brand) => REJECTED_BRANDS.has(brand))
  ) {
    return null
  }
  if (brands.some((brand) => HEIC_BRANDS.has(brand))) return 'image/heic'
  if (brands.some((brand) => HEIF_BRANDS.has(brand))) return 'image/heif'
  return null
}

/**
 * Applies EXIF orientation, scales the longest side to at most 1600 px, and
 * re-encodes as WebP. Sharp strips metadata unless `withMetadata()` is asked
 * for, which drops GPS and every other EXIF field.
 */
export async function encodeWallPhoto(
  bytes: Buffer
): Promise<{ data: Buffer; width: number; height: number }> {
  try {
    const { data, info } = await sharp(bytes, {
      failOn: 'error',
      pages: 1,
      animated: false,
    })
      .rotate()
      .resize({
        width: WALL_MAX_EDGE,
        height: WALL_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true })
    if (!info.width || !info.height) throw new WallImageError()
    return { data, width: info.width, height: info.height }
  } catch (error) {
    if (error instanceof WallImageError) throw error
    throw new WallImageError()
  }
}
