import cn from 'clsx'

import { Heading } from '@/components/ui/heading'

import s from '@/components/world/world.module.css'

interface ProcessStep {
  id?: string | null
  title: string
  description: string
}
export function ProcessSteps({
  items,
  note,
}: {
  items: ProcessStep[]
  note?: string | null | undefined
}) {
  return (
    <>
      <ol className={s.trail}>
        {items.map((item, index) => (
          <li key={item.id ?? item.title} className={s.step}>
            <div className={cn(s.stepCard, 'bg-void-2')}>
              <span aria-hidden="true" className={cn(s.stepNumber, 'h2')}>
                {index + 1}
              </span>
              <Heading as="h3" size="h3">
                {item.title}
              </Heading>
              <p className="dr-mt-16 p text-silver">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="p text-silver">{note}</p>}
    </>
  )
}
