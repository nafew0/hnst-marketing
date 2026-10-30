import { describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { desktopFrameArgs, loopMp4Args, posterArgs } from './args'
import { assertWithinBudget, buildManifest } from './chapter'
import { publishTree } from './publish'

async function scratch() {
  return mkdtemp(path.join(tmpdir(), 'hnst-media-'))
}

describe('media budgets and manifest', () => {
  it('fails when a chapter is over the frame budget', () => {
    expect(() =>
      assertWithinBudget({ desktop: 9, mobile: 1 }, { desktop: 8, mobile: 4 })
    ).toThrow(/Desktop frames/)
    expect(() =>
      assertWithinBudget({ desktop: 1, mobile: 5 }, { desktop: 8, mobile: 4 })
    ).toThrow(/Mobile frames/)
  })

  it('publishes a manifest whose urls use the content hash', async () => {
    const source = await scratch()
    const destination = await scratch()
    try {
      const chapter = path.join(source, 'ch1')
      await mkdir(chapter)
      await writeFile(path.join(chapter, 'd_0001.webp'), Buffer.alloc(10))
      await writeFile(path.join(chapter, 'm_0001.webp'), Buffer.alloc(4))
      await writeFile(path.join(chapter, 'poster.webp'), Buffer.alloc(3))
      const published = await publishTree(source, destination)
      expect(published.manifests).toHaveLength(1)
      const manifest = published.manifests[0]
      expect(manifest?.frames).toBe(1)
      expect(manifest?.fps).toBe(12)
      expect(manifest?.desktop[0]).toBe(
        `/media/${published.hash}/ch1/d_0001.webp`
      )
      expect(manifest?.bytes.desktop).toBe(10)
      expect(manifest?.bytes.mobile).toBe(4)
      const saved = await readFile(
        path.join(destination, published.hash, 'ch1', 'manifest.json'),
        'utf8'
      )
      expect(saved).toContain(`/media/${published.hash}/ch1/poster.webp`)
    } finally {
      await rm(source, { recursive: true, force: true })
      await rm(destination, { recursive: true, force: true })
    }
  })

  it('refuses a chapter whose frame counts differ', async () => {
    const source = await scratch()
    try {
      const chapter = path.join(source, 'ch1')
      await mkdir(chapter)
      await writeFile(path.join(chapter, 'd_0001.webp'), Buffer.alloc(1))
      await writeFile(path.join(chapter, 'd_0002.webp'), Buffer.alloc(1))
      await writeFile(path.join(chapter, 'm_0001.webp'), Buffer.alloc(1))
      await writeFile(path.join(chapter, 'poster.webp'), Buffer.alloc(1))
      await expect(
        buildManifest(source, 'ch1', (relative) => relative)
      ).rejects.toThrow(/desktop frames/)
    } finally {
      await rm(source, { recursive: true, force: true })
    }
  })

  it('uses the plan ffmpeg flags', () => {
    expect(desktopFrameArgs('ch1.mp4', 'out/d_%04d.webp').join(' ')).toContain(
      'fps=12,scale=1280:-2:flags=lanczos,unsharp=5:5:0.4'
    )
    expect(posterArgs('ch1.mp4', 'out/poster.webp')).toContain('-quality')
    expect(loopMp4Args('hero.mp4', 'out/hero.mp4')).toContain('+faststart')
    expect(loopMp4Args('hero.mp4', 'out/hero.mp4')).not.toContain(
      'ignoreFreeSlotValidation'
    )
  })
})
