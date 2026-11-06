import * as initial from './20261030-002251-initial'
import * as wave3 from './20261030-143655-p6-pages-booking'
import * as wall from './20261106-141330-m3-wall-photos'
import * as phone from './20261106-142013-m3-phone-content'
export const migrations = [
  { up: initial.up, down: initial.down, name: '20261030_002251_initial' },
  { up: wave3.up, down: wave3.down, name: '20261030-143655-p6-pages-booking' },
  { up: wall.up, down: wall.down, name: '20261106-141330-m3-wall-photos' },
  { up: phone.up, down: phone.down, name: '20261106-142013-m3-phone-content' },
]
