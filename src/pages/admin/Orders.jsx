import { useEffect, useState } from 'react'
import { Search, ClipboardList, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getOrders, updateOrderStatus, ORDER_STATUSES, STATUS_LABELS } from '../../services/orderService'
import { formatMoney, formatDateTime } from '../../utils/format'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { EmptyState } from '../../components/Feedback'
import { useToast } from '../../contexts/ToastContext'

const PAGE_SIZE = 15

const STATUS_STYLES = {
  new: 'bg-palm-50 text-palm-600',
  confirmed: 'bg-palm-100 text-palm-700',
  processing: 'bg-sand-100 text-sand-600',
  exported_to_zambeel: 'bg-sand-100 text-sand-600',
  shipped: 'bg-ink/10 text-ink-soft',
  delivered: 'bg-palm-500/15 text-palm-700',
  cancelled: 'bg-rust-500/10 text-rust-500',
  returned: 'bg-rust-500/10 text-rust-500',
}

export default function Orders() {
  const settings = useStoreSettings()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState(null)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)

  async function load() {
    const { orders: data, total: t } = await getOrders({ search, status: status || null, page, pageSize: PAGE_SIZE })
    setOrders(data)
    setTotal(t)
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page])

  async function handleStatusChange(order, newStatus) {
    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success(`Order ${order.order_reference} marked as ${STATUS_LABELS[newStatus]}`)
      load()
      if (selected?.id === order.id) setSelected((s) => ({ ...s, status: newStatus }))
    } catch (err) {
      toast.error(err.message || 'Could not update order status')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <input className="input pl-9" placeholder="Search name, phone, order ref…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {orders === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders found" description="Orders will appear here as customers check out." />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-dim text-ink/50 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">City</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Zambeel</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-paper-dim/50 cursor-pointer ${!o.zambeel_exported ? 'bg-sand-100/20' : ''}`} onClick={() => setSelected(o)}>
                    <td className="px-4 py-3 font-medium text-ink">{o.order_reference}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.customer_name}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.delivery_city}</td>
                    <td className="px-4 py-3 text-ink">{formatMoney(o.total_amount, settings.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${o.zambeel_exported ? 'bg-palm-50 text-palm-600' : 'bg-sand-100 text-sand-600'}`}>
                        {o.zambeel_exported ? 'Exported' : 'Not exported'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUS_STYLES[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/50 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-ink/45">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline py-1.5 px-2.5 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline py-1.5 px-2.5 disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4">
          <div className="card w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink">{selected.order_reference}</h3>
              <button onClick={() => setSelected(null)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
            </div>

            <div className="space-y-1.5 text-sm mb-4">
              <p><span className="text-ink/50">Customer:</span> {selected.customer_name}</p>
              <p><span className="text-ink/50">Phone:</span> {selected.customer_phone}</p>
              <p><span className="text-ink/50">Address:</span> {[selected.address_line, selected.building, selected.area].filter(Boolean).join(', ')}</p>
              <p><span className="text-ink/50">City / Emirate:</span> {selected.delivery_city}{selected.emirate ? `, ${selected.emirate}` : ''}</p>
              {selected.delivery_notes && <p><span className="text-ink/50">Notes:</span> {selected.delivery_notes}</p>}
            </div>

            <table className="w-full text-sm mb-4">
              <thead className="text-xs text-ink/45 uppercase">
                <tr>
                  <th className="text-left py-1.5">Item</th>
                  <th className="text-left py-1.5">SKU</th>
                  <th className="text-right py-1.5">Qty</th>
                  <th className="text-right py-1.5">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {selected.order_items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-1.5">{it.product_name}</td>
                    <td className="py-1.5 text-ink/50">{it.product_sku}</td>
                    <td className="py-1.5 text-right">{it.quantity}</td>
                    <td className="py-1.5 text-right">{formatMoney(it.unit_price, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm border-t border-ink/8 pt-3 mb-4">
              <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span>{formatMoney(selected.subtotal, settings.currency)}</span></div>
              <div className="flex justify-between text-ink-soft"><span>Shipping</span><span>{formatMoney(selected.shipping_charges, settings.currency)}</span></div>
              <div className="flex justify-between text-ink-soft"><span>Discount</span><span>-{formatMoney(selected.discount, settings.currency)}</span></div>
              <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>{formatMoney(selected.total_amount, settings.currency)}</span></div>
            </div>

            <div>
              <label className="label">Order status</label>
              <select
                className="input"
                value={selected.status}
                onChange={(e) => handleStatusChange(selected, e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
