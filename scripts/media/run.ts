import { spawn } from 'node:child_process'

export function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    const stderr: Buffer[] = []
    child.stderr.on('data', (chunk) => {
      stderr.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      const detail = Buffer.concat(stderr).toString('utf8').trim().slice(-400)
      reject(new Error(`${command} exited ${code ?? 'null'}: ${detail}`))
    })
  })
}

export function runFfmpeg(args: string[]): Promise<void> {
  return runCommand('ffmpeg', args)
}
