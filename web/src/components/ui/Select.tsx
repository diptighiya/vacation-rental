import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: { value: string; label: string }[]
  error?: string
}

export function Select({ label, options, error, className = '', ...props }: SelectProps) {
  const id = useId()

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <select
        {...props}
        id={id}
        aria-invalid={!!error}
        className={`h-10 rounded-control border bg-surface px-3 text-sm text-ink-900 outline-none
          focus:ring-2 disabled:bg-ink-100
          ${error ? 'border-removed focus:ring-removed/30' : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-removed">{error}</p>}
    </div>
  )
}
