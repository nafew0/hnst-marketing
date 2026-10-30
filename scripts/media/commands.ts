import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  desktopFrameArgs,
  loopMp4Args,
  loopWebmArgs,
  mobileFrameArgs,
  posterArgs,
} from './args'
import { buildManifest, type ChapterManifest } from './chapter'
import { publishTree, rsyncTree } from './publish'
import { runFfmpeg } from './run'

export function mediaOutDir(cwd = process.cwd()): string {
  return path.join(cwd, 'media-out')
}

export function publishedMediaDir(cwd = process.cwd()): string {
  return path.join(cwd, 'public', 'media')
}

function stemOf(clip: string): string {
  return path.basename(clip, path.extname(clip))
}

export async function extractFrames(input: {
  clip: string
  chapter: string
  mobileClip?: string
  cwd?: string
}): Promise<void> {
  const dir = path.join(mediaOutDir(input.cwd), input.chapter)
  await mkdir(dir, { recursive: true })
  const mobile = input.mobileClip ?? input.clip
  await runFfmpeg(desktopFrameArgs(input.clip, path.join(dir, 'd_%04d.webp')))
  await runFfmpeg(mobileFrameArgs(mobile, path.join(dir, 'm_%04d.webp')))
}

export async function makePoster(input: {
  clip: string
  chapter?: string
  cwd?: string
}): Promise<string> {
  const chapter = input.chapter ?? stemOf(input.clip)
  const dir = path.join(mediaOutDir(input.cwd), chapter)
  await mkdir(dir, { recursive: true })
  const output = path.join(dir, 'poster.webp')
  await runFfmpeg(posterArgs(input.clip, output))
  return output
}

export async function makeLoop(input: {
  clip: string
  cwd?: string
}): Promise<{ webm: string; mp4: string }> {
  const dir = mediaOutDir(input.cwd)
  await mkdir(dir, { recursive: true })
  const stem = stemOf(input.clip)
  const webm = path.join(dir, `${stem}.webm`)
  const mp4 = path.join(dir, `${stem}.mp4`)
  await runFfmpeg(loopWebmArgs(input.clip, webm))
  await runFfmpeg(loopMp4Args(input.clip, mp4))
  return { webm, mp4 }
}

export async function writeManifest(input: {
  chapter: string
  cwd?: string
}): Promise<ChapterManifest> {
  const root = mediaOutDir(input.cwd)
  const manifest = await buildManifest(
    root,
    input.chapter,
    (relative) => relative
  )
  await writeFile(
    path.join(root, input.chapter, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  return manifest
}

export async function publish(input: {
  cwd?: string
  remoteRoot?: string
}): Promise<void> {
  const source = mediaOutDir(input.cwd)
  const destination = publishedMediaDir(input.cwd)
  const published = await publishTree(source, destination)
  for (const manifest of published.manifests) {
    console.log(JSON.stringify(manifest))
  }
  for (const loop of published.loops) console.log(loop)
  const remoteRoot = input.remoteRoot
  if (!remoteRoot) return
  const local = path.join(destination, published.hash)
  const remote = remoteRoot.endsWith('/')
    ? `${remoteRoot}${published.hash}/`
    : `${remoteRoot}/${published.hash}/`
  await rsyncTree(local, remote)
  console.log(remote)
}
