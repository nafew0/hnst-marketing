'use client'

import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'

import s from './kit.module.css'

interface SegmentedOption<Value extends string> {
  value: Value
  label: string
}

interface SegmentedProps<Value extends string> {
  /** Names the group for screen readers, e.g. "Album". */
  label: string
  options: readonly SegmentedOption<Value>[]
  value: Value
  onValueChange: (value: Value) => void
}

/** iOS's segmented control: one of a few options, always one chosen. */
export function Segmented<Value extends string>({
  label,
  options,
  value,
  onValueChange,
}: SegmentedProps<Value>) {
  return (
    <ToggleGroup
      aria-label={label}
      className={s.segmented}
      value={[value]}
      onValueChange={(next) => {
        const chosen = options.find((option) => next.includes(option.value))
        // Pressing the chosen one again would leave none: keep it.
        if (chosen) onValueChange(chosen.value)
      }}
    >
      {options.map((option) => (
        <Toggle key={option.value} value={option.value} className={s.segment}>
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}
