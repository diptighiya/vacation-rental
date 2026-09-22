import type { ReactNode } from 'react'

type Tone = 'error' | 'success' | 'info' | 'warning'

const tones: Record<Tone, string> = {
  error: 'bg-removed-bg text-removed border-removed/30',
  success: 'bg-approved-bg text-approved border-approved/30',
  info: 'bg-info-bg text-info border-info/30',
  warning: 'bg-pending-bg text-pending border-pending/30',
}

/** Inline page-level message. For request failures pass errorMessage(error) from apiClient. */
export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
}) {
  return (
    <div role="alert" className={`rounded-control border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? 'mt-0.5' : ''}>{children}</div>
    </div>
  )
}
