import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success', duration = 4000) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration) setTimeout(() => remove(id), duration)
      return id
    },
    [remove]
  )

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }

  const icons = {
    success: <CheckCircle2 size={18} className="text-palm-500" />,
    error: <XCircle size={18} className="text-rust-500" />,
    info: <Info size={18} className="text-sand-600" />,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,90vw)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card flex items-start gap-2.5 px-4 py-3 animate-[fadeIn_0.15s_ease-out]"
            role="status"
          >
            {icons[t.type]}
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-ink/40 hover:text-ink">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
