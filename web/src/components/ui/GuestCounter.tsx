/** Stepper for #guests. Clamped to the listing's max so the UI can't submit an invalid booking. */
export function GuestCounter({
  value,
  onChange,
  max = 16,
  min = 1,
  label = 'Guests',
}: {
  value: number
  onChange: (value: number) => void
  max?: number
  min?: number
  label?: string
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)))

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <div className="flex h-10 w-fit items-center gap-1 rounded-control border border-ink-300 bg-surface px-1">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= min}
          aria-label="Remove a guest"
          className="size-8 rounded-full text-lg leading-none text-ink-700 hover:bg-ink-100 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= max}
          aria-label="Add a guest"
          className="size-8 rounded-full text-lg leading-none text-ink-700 hover:bg-ink-100 disabled:opacity-40"
        >
          +
        </button>
      </div>
      {value >= max && <p className="text-xs text-ink-500">Maximum {max} guests</p>}
    </div>
  )
}
