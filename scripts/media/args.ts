/** Flags from docs/PLAN.md §8.6. `-y` lets a rerun replace frames without a prompt. */

export const FRAME_FPS = 12

export function desktopFrameArgs(clip: string, pattern: string): string[] {
  return [
    '-y',
    '-i',
    clip,
    '-vf',
    'fps=12,scale=1280:-2:flags=lanczos,unsharp=5:5:0.4',
    '-c:v',
    'libwebp',
    '-quality',
    '72',
    '-compression_level',
    '6',
    pattern,
  ]
}

export function mobileFrameArgs(clip: string, pattern: string): string[] {
  return [
    '-y',
    '-i',
    clip,
    '-vf',
    'fps=12,scale=720:-2:flags=lanczos',
    '-c:v',
    'libwebp',
    '-quality',
    '70',
    pattern,
  ]
}

export function posterArgs(clip: string, output: string): string[] {
  return [
    '-y',
    '-i',
    clip,
    '-frames:v',
    '1',
    '-vf',
    'scale=1600:-2',
    '-c:v',
    'libwebp',
    '-quality',
    '80',
    output,
  ]
}

export function loopWebmArgs(clip: string, output: string): string[] {
  return [
    '-y',
    '-i',
    clip,
    '-vf',
    'scale=1280:-2',
    '-c:v',
    'libvpx-vp9',
    '-g',
    '1',
    '-b:v',
    '0',
    '-crf',
    '34',
    '-an',
    output,
  ]
}

export function loopMp4Args(clip: string, output: string): string[] {
  return [
    '-y',
    '-i',
    clip,
    '-vf',
    'scale=1280:-2',
    '-c:v',
    'libx264',
    '-g',
    '1',
    '-crf',
    '23',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    output,
  ]
}
