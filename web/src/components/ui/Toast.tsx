/** App-wide toasts. Wrap the app in <ToastProvider> (already done in App.tsx)
 *  and call const toast = useToast(); toast.success('Booking cancelled'). */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: Tone
  message: string
}

const tones: Record<Tone, string> = {
  success: 'border-approved/40 bg-approved-bg text-approved',
  error: 'border-removed/40 bg-removed-bg text-removed',
  info: 'border-info/40 bg-info-bg text-info',
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((tone: Tone, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, tone, message }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-control border px-4 py-3 text-sm shadow-lg ${tones[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
