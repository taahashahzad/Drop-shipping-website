import { useEffect, useState } from 'react'
import { History, ChevronDown, ChevronUp } from 'lucide-react'
import { getExportHistory } from '../../services/zambeelExport'
import { formatDateTime, formatMoney } from '../../utils/format'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { EmptyState } from '../../components/Feedback'

export default function ExportHistory() {
  const settings = useStoreSettings()
  const [exports, setExports] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getExportHistory().then(setExports)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Zambeel Export History</h1>

      {exports === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : exports.length === 0 ? (
        <EmptyState icon={History} title="No exports yet" description="Once you generate a Zambeel export, it will be logged here." />
      ) : (
        <div className="space-y-3">
          {exports.map((exp) => (
            <div key={exp.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-medium text-ink text-sm">{exp.filename}</p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {formatDateTime(exp.created_at)} · {exp.order_count} order{exp.order_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${exp.status === 'completed' ? 'bg-palm-50 text-palm-600' : 'bg-rust-500/10 text-rust-500'}`}>
                    {exp.status === 'completed' ? 'Completed' : 'Failed'}
                  </span>
                  {expanded === exp.id ? <ChevronUp size={16} className="text-ink/40" /> : <ChevronDown size={16} className="text-ink/40" />}
                </div>
              </button>
              {expanded === exp.id && (
                <div className="border-t border-ink/8 px-5 py-4">
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">Included orders</p>
                  <ul className="divide-y divide-ink/5">
                    {(exp.zambeel_export_items || []).map((item) => (
                      <li key={item.id} className="flex justify-between text-sm py-1.5">
                        <span className="text-ink">{item.order?.order_reference} — {item.order?.customer_name}</span>
                        <span className="text-ink-soft">{formatMoney(item.order?.total_amount, settings.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
