import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '../..')

describe('wall worker wiring', () => {
  it('schedules the daily purge from the worker', () => {
    const main = readFileSync(join(root, 'worker/main.ts'), 'utf8')
    expect(main).toContain('scheduleWallPurge')
    expect(main).toContain('runWallPurge')
    expect(main).toContain('WALL_PURGE_QUEUE')
  })

  it('keeps the wall routes on the handlers', () => {
    const route = readFileSync(join(root, 'app/api/v1/wall/route.ts'), 'utf8')
    expect(route).toContain('postWall')
    expect(route).toContain('getWall')
    const report = readFileSync(
      join(root, 'app/api/v1/wall/report/route.ts'),
      'utf8'
    )
    const remove = readFileSync(
      join(root, 'app/api/v1/wall/remove/route.ts'),
      'utf8'
    )
    expect(report).toContain('reportWall')
    expect(remove).toContain('removeWall')
  })

  it('has Caddy set X-Forwarded-For to the connecting client', () => {
    const caddy = readFileSync(join(root, 'deploy/Caddyfile'), 'utf8')
    expect(caddy).toContain(
      'header_up X-Forwarded-For {http.request.remote.host}'
    )
  })
})
