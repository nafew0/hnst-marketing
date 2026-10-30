import { ImageResponse } from 'next/og'

import { brand } from '@/brand.config'
export function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: brand.palette.void,
        color: brand.palette.gold,
        padding: 80,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 28 }}>HONEST MARKETING</div>
      <div style={{ fontSize: 76, maxWidth: 1000 }}>
        Your next chapter.
        <br />
        Built together.
      </div>
      <div style={{ fontSize: 24 }}>hnst.marketing</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
