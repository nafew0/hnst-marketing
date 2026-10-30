import { Heading } from '@/components/ui/heading'
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
      <ol className="flex flex-col dr-gap-32">
        {items.map((item, index) => (
          <li
            key={item.id ?? item.title}
            className="grid grid-cols-[48px_1fr] dr-gap-24 border-t border-gold/20 dr-pt-24"
          >
            <span aria-hidden="true" className="h3 text-gold">
              {index + 1}
            </span>
            <div>
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
