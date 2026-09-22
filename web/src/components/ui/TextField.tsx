import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Server-side message from ApiError.fields[name] — renders below the input. */
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
        {props.required && <span className="ml-0.5 text-removed">*</span>}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`h-10 rounded-control border bg-surface px-3 text-sm text-ink-900 outline-none
          placeholder:text-ink-500/70 focus:ring-2 disabled:bg-ink-100
          ${error ? 'border-removed focus:ring-removed/30' : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'}`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-removed">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
