import {
  type FrameStyle,
  SHOT_ASPECT,
  SHOT_MAX_EDGE,
  SHOT_QUALITY,
  coverCrop,
  drawFrame,
  fitWithin,
} from './frame'
import { type Shot, addShot } from './shots'

interface Source {
  image: CanvasImageSource
  width: number
  height: number
}

interface RenderOptions {
  /** Crop to this shape, as the viewfinder shows it; null keeps the whole picture. */
  aspect: number | null
  /** The front camera's preview is a mirror, so the photo matches it. The frame isn't mirrored. */
  mirror: boolean
  frame: FrameStyle
}

function jpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The photo could not be made')),
      'image/jpeg',
      SHOT_QUALITY
    )
  })
}

/** Waits for the frame's font, so the label never draws in a fallback face. */
export async function frameFontReady(frame: FrameStyle) {
  await document.fonts
    .load(`600 16px ${frame.fontFamily}`, frame.text)
    .catch(() => undefined)
}

/**
 * Draws the picture with the frame into a JPEG. A canvas keeps no metadata,
 * so EXIF and GPS never leave the phone; the back end strips them again.
 */
async function render(source: Source, options: RenderOptions) {
  const crop = options.aspect
    ? coverCrop(source.width, source.height, options.aspect)
    : { x: 0, y: 0, width: source.width, height: source.height }
  const size = fitWithin(crop.width, crop.height, SHOT_MAX_EDGE)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The photo could not be made')
  context.save()
  if (options.mirror) {
    context.translate(size.width, 0)
    context.scale(-1, 1)
  }
  context.drawImage(
    source.image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size.width,
    size.height
  )
  context.restore()
  await frameFontReady(options.frame)
  drawFrame(context, size.width, size.height, options.frame)
  return { blob: await jpeg(canvas), ...size }
}

function keep(blob: Blob, width: number, height: number): Shot {
  const shot: Shot = {
    id: crypto.randomUUID(),
    blob,
    url: URL.createObjectURL(blob),
    width,
    height,
    takenAt: Date.now(),
  }
  addShot(shot)
  return shot
}

/** The shutter: the viewfinder's picture, cropped as shown, in the frame. */
export async function shootVideo(
  video: HTMLVideoElement,
  mirror: boolean,
  frame: FrameStyle
) {
  if (!video.videoWidth || !video.videoHeight)
    throw new Error('The camera has no picture yet')
  const { blob, width, height } = await render(
    { image: video, width: video.videoWidth, height: video.videoHeight },
    { aspect: SHOT_ASPECT, mirror, frame }
  )
  return keep(blob, width, height)
}

/** A photo from the picker, whole and upright, in the frame. */
export async function shootFile(file: Blob, frame: FrameStyle) {
  const bitmap = await createImageBitmap(file)
  try {
    const { blob, width, height } = await render(
      { image: bitmap, width: bitmap.width, height: bitmap.height },
      { aspect: null, mirror: false, frame }
    )
    return keep(blob, width, height)
  } finally {
    bitmap.close()
  }
}

export function shotFileName(shot: Shot) {
  const stamp = new Date(shot.takenAt)
    .toISOString()
    .slice(0, 19)
    .replaceAll(':', '-')
  return `honest-${stamp}.jpg`
}

/** Downloads the photo. */
export function saveShot(shot: Shot) {
  const link = document.createElement('a')
  link.href = shot.url
  link.download = shotFileName(shot)
  link.click()
}

/**
 * The Web Share sheet with the photo; where a browser can't share files, the
 * photo downloads instead.
 */
export async function shareShot(
  shot: Shot
): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([shot.blob], shotFileName(shot), {
    type: 'image/jpeg',
  })
  if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        return 'cancelled'
    }
  }
  saveShot(shot)
  return 'saved'
}
