import { PackageSearch, AlertTriangle } from 'lucide-react'

export function EmptyState({ icon: Icon = PackageSearch, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-full bg-palm-50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-palm-500" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink/55 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel, loading = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4">
      <div className="card w-full max-w-sm p-5">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="w-9 h-9 rounded-full bg-rust-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-rust-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            {description && <p className="text-sm text-ink/60 mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={danger ? 'btn bg-rust-500 text-white hover:bg-rust-500/90' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
