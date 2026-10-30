import { createHash } from 'node:crypto'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  buildManifest,
  type ChapterManifest,
  type FrameBudgets,
} from './chapter'
import { runCommand } from './run'

async function walk(root: string, dir: string, found: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(root, full, found)
    else if (entry.isFile()) found.push(path.relative(root, full))
  }
}

export async function listFiles(root: string): Promise<string[]> {
  const found: string[] = []
  await walk(root, root, found)
  found.sort()
  return found
}

export async function chapterNames(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const names: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) names.push(entry.name)
  }
  names.sort()
  return names
}

/** Hash of file bytes, ignoring manifest.json so rewriting URLs stays stable. */
export async function contentHash(root: string): Promise<string> {
  const hash = createHash('sha256')
  for (const file of await listFiles(root)) {
    if (path.basename(file) === 'manifest.json') continue
    hash.update(file)
    hash.update(await readFile(path.join(root, file)))
  }
  return hash.digest('hex').slice(0, 16)
}

function withUrls(manifest: ChapterManifest, hash: string): ChapterManifest {
  const mapUrl = (relative: string) => `/media/${hash}/${relative}`
  return {
    chapter: manifest.chapter,
    fps: manifest.fps,
    frames: manifest.frames,
    desktop: manifest.desktop.map(mapUrl),
    mobile: manifest.mobile.map(mapUrl),
    poster: mapUrl(manifest.poster),
    bytes: manifest.bytes,
  }
}

/**
 * Copies `source` into `publicRoot/<hash>/`. Budgets are checked first, so an
 * over-budget chapter is not published. Pass `remoteRoot` (`user@host:/srv/media`)
 * to also rsync; localhost omits it.
 */
export async function publishTree(
  source: string,
  publicRoot: string,
  limits?: FrameBudgets
): Promise<{ hash: string; manifests: ChapterManifest[]; loops: string[] }> {
  const chapters = await chapterNames(source)
  const drafts: ChapterManifest[] = []
  for (const chapter of chapters) {
    const urlFor = (relative: string) => relative
    const manifest = limits
      ? await buildManifest(source, chapter, urlFor, limits)
      : await buildManifest(source, chapter, urlFor)
    drafts.push(manifest)
  }

  const hash = await contentHash(source)
  const destination = path.join(publicRoot, hash)
  await mkdir(destination, { recursive: true })
  for (const file of await listFiles(source)) {
    if (path.basename(file) === 'manifest.json') continue
    const target = path.join(destination, file)
    await mkdir(path.dirname(target), { recursive: true })
    await copyFile(path.join(source, file), target)
  }

  const manifests: ChapterManifest[] = []
  for (const draft of drafts) {
    const manifest = withUrls(draft, hash)
    await mkdir(path.join(destination, manifest.chapter), { recursive: true })
    await writeFile(
      path.join(destination, manifest.chapter, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`
    )
    manifests.push(manifest)
  }

  const loops = (await listFiles(source))
    .filter(
      (file) =>
        !file.includes('/') && (file.endsWith('.webm') || file.endsWith('.mp4'))
    )
    .map((file) => `/media/${hash}/${file}`)

  return { hash, manifests, loops }
}

export function rsyncTree(localDir: string, remote: string): Promise<void> {
  return runCommand('rsync', ['-a', `${localDir}/`, remote])
}
