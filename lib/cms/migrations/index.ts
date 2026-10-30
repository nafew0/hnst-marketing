import * as initial from './20261030-002251-initial'
import * as wave3 from './20261030-143655-p6-pages-booking'
export const migrations = [
  { up: initial.up, down: initial.down, name: '20261030_002251_initial' },
  { up: wave3.up, down: wave3.down, name: '20261030-143655-p6-pages-booking' },
]
