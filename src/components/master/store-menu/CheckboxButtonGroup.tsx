'use client'

import { useId, type ReactNode } from 'react'

export interface CheckboxOption<T extends string = string> {
  value: T
  label: ReactNode
}

export interface CheckboxButtonGroupProps<T extends string = string> {
  options: CheckboxOption<T>[]
  values: T[]
  onChange: (values: T[]) => void
  disabled?: boolean
  label?: string
  required?: boolean
  className?: string
  name?: string
}

export default function CheckboxButtonGroup<T extends string = string>({
  options,
  values,
  onChange,
  disabled = false,
  label,
  required = false,
  className = '',
  name,
}: CheckboxButtonGroupProps<T>) {
  const groupId = useId()
  const groupName = name || groupId

  const handleToggle = (optionValue: T) => {
    if (disabled) return
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue))
    } else {
      onChange([...values, optionValue])
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="flex items-center gap-1 mb-2 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="radio-wrap" role="group" aria-label={label ?? name ?? 'checkbox group'}>
        {options.map((option) => {
          const isSelected = values.includes(option.value)
          const optionId = `${groupId}-${option.value}`

          return (
            <div key={option.value} className="radio-btn-wrap">
              <input
                type="checkbox"
                id={optionId}
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                disabled={disabled}
                className="sr-only"
              />
              <label
                htmlFor={optionId}
                className={`radio-btn${isSelected ? ' act' : ''}`}
              >
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
