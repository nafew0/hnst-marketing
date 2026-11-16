import { Image } from '@/components/ui/image'
import { WORLD_CLIPS } from '@/components/world/worlds'

/** Pages → Background scenes: what each choice looks like (its poster). */
export function SceneGallery() {
  return (
    <div className="hnst-scenes">
      <p>
        Each page has three moving scenes: behind its top heading, between its
        sections, and behind its closing button. Leave one on “Default” to keep
        the page’s own choice.
      </p>
      <ul>
        {WORLD_CLIPS.map((clip) => (
          <li key={clip.value}>
            <Image
              src={`/worlds/${clip.value}.webp`}
              alt=""
              width={160}
              height={90}
              sizes="160px"
            />
            <span>{clip.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
