import type { Metadata } from 'next'

import { WallRemoval } from './remove'
export const metadata: Metadata = {
  title: 'Remove your wall photo',
  robots: { index: false, follow: false },
}
export default function RemoveWallPage() {
  return <WallRemoval />
}
