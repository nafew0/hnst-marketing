import { unlink } from 'node:fs/promises'
import path from 'node:path'

const SAFE_NAME = /^[\w.-]+$/u

/** Same rule as the `wallPhotos` collection: the directory is never inside `public/`. */
export function resolveWallDirectory(
  configured?: string,
  cwd = process.cwd()
): string {
  const directory = path.resolve(cwd, configured ?? './.data/wall')
  const publicDirectory = path.resolve(cwd, 'public')
  if (
    directory === publicDirectory ||
    directory.startsWith(`${publicDirectory}${path.sep}`)
  ) {
    throw new Error('WALL_MEDIA_DIR must be outside public/')
  }
  return directory
}

export function isSafeWallFilename(name: string): boolean {
  return (
    name !== '.' &&
    name !== '..' &&
    path.basename(name) === name &&
    SAFE_NAME.test(name)
  )
}

export function isEnoent(error: Error): boolean {
  return 'code' in error && error.code === 'ENOENT'
}

/** Deletes one basename in `directory`. A missing file is already gone. */
export async function unlinkWallFile(
  directory: string,
  name: string | null | undefined
): Promise<void> {
  if (!name || !isSafeWallFilename(name)) return
  try {
    await unlink(path.join(directory, name))
  } catch (error) {
    if (error instanceof Error && isEnoent(error)) return
    throw error
  }
}
