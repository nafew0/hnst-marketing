import {
  extractFrames,
  makeLoop,
  makePoster,
  publish,
  writeManifest,
} from './commands'

const [command, ...args] = process.argv.slice(2)

function required(value: string | undefined, usage: string): string {
  if (!value) throw new Error(usage)
  return value
}

try {
  if (command === 'extract-frames') {
    const clip = required(
      args[0],
      'usage: extract-frames <clip> <chapter> [mobileClip]'
    )
    const chapter = required(
      args[1],
      'usage: extract-frames <clip> <chapter> [mobileClip]'
    )
    const mobileClip = args[2]
    if (mobileClip) await extractFrames({ clip, chapter, mobileClip })
    else await extractFrames({ clip, chapter })
  } else if (command === 'make-poster') {
    const clip = required(args[0], 'usage: make-poster <clip> [chapter]')
    const chapter = args[1]
    if (chapter) await makePoster({ clip, chapter })
    else await makePoster({ clip })
  } else if (command === 'make-loop') {
    const clip = required(args[0], 'usage: make-loop <clip>')
    await makeLoop({ clip })
  } else if (command === 'manifest') {
    const chapter = required(args[0], 'usage: manifest <chapter>')
    const manifest = await writeManifest({ chapter })
    console.log(JSON.stringify(manifest))
  } else if (command === 'publish') {
    const remoteRoot = args[0]
    if (remoteRoot) await publish({ remoteRoot })
    else await publish({})
  } else {
    throw new Error(
      'usage: extract-frames | make-poster | make-loop | manifest | publish'
    )
  }
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'media command failed'
  console.error(message)
  process.exit(1)
}
