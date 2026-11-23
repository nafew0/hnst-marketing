import { describe, expect, it } from 'bun:test'

import { parseInstagramMedia } from './instagram'

const row = {
  id: '1',
  caption: ' A launch day ',
  media_type: 'IMAGE',
  media_url: 'https://scontent.cdninstagram.com/v/a.jpg',
  permalink: 'https://www.instagram.com/p/abc/',
  timestamp: '2026-11-20T10:00:00+0000',
}

describe('the live Instagram feed', () => {
  it('reads pictures, and a video by its cover', () => {
    const posts = parseInstagramMedia({
      data: [
        row,
        {
          ...row,
          id: '2',
          media_type: 'VIDEO',
          media_url: 'https://video.cdninstagram.com/v.mp4',
          thumbnail_url: 'https://scontent.cdninstagram.com/v/cover.jpg',
        },
      ],
    })
    expect(posts.map((post) => [post.id, post.video, post.image])).toEqual([
      ['1', false, 'https://scontent.cdninstagram.com/v/a.jpg'],
      ['2', true, 'https://scontent.cdninstagram.com/v/cover.jpg'],
    ])
    expect(posts[0]?.caption).toBe('A launch day')
  })

  it('leaves out rows it cannot show, and pictures on other hosts', () => {
    expect(
      parseInstagramMedia({
        data: [
          { id: '3' },
          { ...row, id: '4', media_url: 'https://example.com/a.jpg' },
          { ...row, id: '5', media_type: 'VIDEO', thumbnail_url: null },
        ],
      })
    ).toEqual([])
  })
})
