import { useEffect, useState } from 'react'
import { FileSpreadsheet, Download, CheckSquare, Square } from 'lucide-react'
import { getUnexportedOrders } from '../../services/orderService'
import { exportOrdersToZambeel, buildZambeelRows } from '../../services/zambeelExport'
import { formatMoney } from '../../utils/format'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { EmptyState, ConfirmDialog } from '../../components/Feedback'
import { useToast } from '../../contexts/ToastContext'

export default function ZambeelExport() {
  const settings = useStoreSettings()
  const toast = useToast()
  const [orders, setOrders] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function load() {
    const data = await getUnexportedOrders()
    setOrders(data)
    setSelectedIds(new Set(data.map((o) => o.id)))
  }

  useEffect(() => {
    load()
  }, [])

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === orders.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(orders.map((o) => o.id)))
  }

  const selectedOrders = (orders || []).filter((o) => selectedIds.has(o.id))
  const previewRows = buildZambeelRows(selectedOrders)

  async function handleExport() {
    setExporting(true)
    try {
      const result = await exportOrdersToZambeel(selectedOrders)
      toast.success(`Order exported successfully. ${result.orderCount} order${result.orderCount !== 1 ? 's' : ''} exported to ${result.filename}.`)
      setConfirmOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Export failed. Orders were not marked as exported.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Zambeel Export</h1>
      <p className="text-sm text-ink/55 mb-6">
        Select new orders and generate an Excel file in the exact Zambeel fulfillment format.
      </p>

      {orders === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="No orders ready for export" description="New, confirmed, and processing orders that haven't been exported will appear here." />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
              {selectedIds.size === orders.length ? <CheckSquare size={17} className="text-palm-500" /> : <Square size={17} />}
              Select all ({orders.length} new orders)
            </button>
            <button
              disabled={selectedOrders.length === 0}
              onClick={() => setConfirmOpen(true)}
              className="btn-primary"
            >
              <Download size={15} /> Export New Orders ({selectedOrders.length})
            </button>
          </div>

          <div className="card overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-paper-dim text-ink/50 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">City</th>
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-paper-dim/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggle(o.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{o.order_reference}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.customer_name}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.delivery_city}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.order_items?.length || 0}</td>
                    <td className="px-4 py-3 text-ink">{formatMoney(o.total_amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-semibold text-ink mb-3">Export preview ({previewRows.length} rows)</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-paper-dim text-ink/50 uppercase tracking-wide">
                <tr>
                  {['Order ref', 'Customer', 'City', 'SKU', 'Qty', 'Price', 'Shipping', 'Discount', 'Total', 'Payment'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 whitespace-nowrap">{r.order_reference_id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.customer_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.delivery_city}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.product_sku}</td>
                    <td className="px-3 py-2">{r.Quantity}</td>
                    <td className="px-3 py-2">{r.price}</td>
                    <td className="px-3 py-2">{r.shipping_charges}</td>
                    <td className="px-3 py-2">{r.Discount}</td>
                    <td className="px-3 py-2">{r.total_amount}</td>
                    <td className="px-3 py-2">{r.payment_mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Generate Zambeel Excel?"
        description={`${selectedOrders.length} order${selectedOrders.length !== 1 ? 's are' : ' is'} ready for export. This will download the .xlsx file and mark ${selectedOrders.length !== 1 ? 'these orders' : 'this order'} as exported.`}
        confirmLabel="Generate & download"
        onConfirm={handleExport}
        onCancel={() => setConfirmOpen(false)}
        loading={exporting}
      />
    </div>
  )
}
