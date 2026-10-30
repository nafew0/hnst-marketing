import * as migration_20261030_002251_initial from './20261030-002251-initial'

export const migrations = [
  {
    up: migration_20261030_002251_initial.up,
    down: migration_20261030_002251_initial.down,
    name: '20261030_002251_initial',
  },
]
