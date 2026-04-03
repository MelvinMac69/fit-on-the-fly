import React from 'react'

export function PillSelector({
  options, // [{ value, label }]
  value,
  onChange,
  multi = false,
  className = '',
}) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {options.map(opt => {
        const isSelected = multi
          ? Array.isArray(value) && value.includes(opt.value)
          : value === opt.value

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150
              border min-h-[44px] whitespace-nowrap
              ${isSelected
                ? 'bg-primary border-primary text-white'
                : 'bg-transparent border-border text-text-secondary hover:border-primary hover:text-text-primary'
              }
            `}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function PillSelectorRow({
  options,
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {options.map(opt => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150
              border min-h-[44px] shrink-0
              ${isSelected
                ? 'bg-primary border-primary text-white'
                : 'bg-transparent border-border text-text-secondary hover:border-primary hover:text-text-primary'
              }
            `}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
