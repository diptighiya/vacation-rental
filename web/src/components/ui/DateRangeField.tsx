/** Check-in / check-out pair with the 14-night rule enforced in the UI.
 *  The server re-validates — this is only to stop obvious mistakes early. */
import { useId } from 'react'

export const MAX_NIGHTS = 14

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.round(ms / 86_400_000)
}

export function DateRangeField({
  checkIn,
  checkOut,
  onChange,
  error,
}: {
  checkIn: string
  checkOut: string
  onChange: (range: { checkIn: string; checkOut: string }) => void
  error?: string
}) {
  const id = useId()
  const nights = nightsBetween(checkIn, checkOut)
  const today = new Date().toISOString().slice(0, 10)
  const tooLong = nights > MAX_NIGHTS
  const invalid = !!checkIn && !!checkOut && nights <= 0
  const message =
    error ??
    (tooLong
      ? `Stays are limited to ${MAX_NIGHTS} nights`
      : invalid
        ? 'Check-out must be after check-in'
        : undefined)

  const inputClass = `h-10 rounded-control border bg-surface px-3 text-sm outline-none focus:ring-2 ${
    message
      ? 'border-removed focus:ring-removed/30'
      : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'
  }`

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">Dates</span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          aria-label="Check-in"
          id={`${id}-in`}
          value={checkIn}
          min={today}
          onChange={(e) => onChange({ checkIn: e.target.value, checkOut })}
          className={inputClass}
        />
        <span className="text-ink-500">→</span>
        <input
          type="date"
          aria-label="Check-out"
          id={`${id}-out`}
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => onChange({ checkIn, checkOut: e.target.value })}
          className={inputClass}
        />
      </div>
      {message ? (
        <p className="text-xs text-removed">{message}</p>
      ) : nights > 0 ? (
        <p className="text-xs text-ink-500">
          {nights} night{nights === 1 ? '' : 's'}
        </p>
      ) : null}
    </div>
  )
}
