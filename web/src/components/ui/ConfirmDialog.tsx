/** Modal confirmation used by: cancel booking, host remove listing, admin remove/reject listing.
 *  Uses <dialog> so Escape and focus trapping come from the platform. */
import { useEffect, useRef } from 'react'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-card border border-ink-300 bg-surface p-0 backdrop:bg-ink-900/40"
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {description && <p className="text-sm text-ink-500">{description}</p>}
        {children}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
