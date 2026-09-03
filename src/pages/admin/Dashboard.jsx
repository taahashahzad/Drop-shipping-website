import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  ClipboardList,
  PackagePlus,
  Cog,
  CheckCircle2,
  XCircle,
  Wallet,
  Boxes,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'
import { getDashboardStats } from '../../services/orderService'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { formatMoney } from '../../utils/format'
import { STATUS_LABELS } from '../../services/orderService'

const STATUS_COLORS = {
  new: '#0F6E4F',
  confirmed: '#7FB89D',
  processing: '#B8863F',
  exported_to_zambeel: '#DEC088',
  shipped: '#3A4150',
  delivered: '#0C5A41',
  cancelled: '#B4472B',
  returned: '#96692D',
}

function StatCard({ icon: Icon, label, value, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink/5 text-ink',
    palm: 'bg-palm-50 text-palm-600',
    rust: 'bg-rust-500/10 text-rust-500',
    sand: 'bg-sand-100 text-sand-600',
  }
  return (
    <div className="card p-4 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-ink/50">{label}</p>
        <p className="text-lg font-semibold text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const settings = useStoreSettings()

  useEffect(() => {
    getDashboardStats().then(setStats)
  }, [])

  if (!stats) {
    return <div className="text-sm text-ink/50">Loading dashboard…</div>
  }

  const pieData = Object.entries(stats.statusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: STATUS_LABELS[status], value, status }))

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Dashboard</h1>

      {stats.unexportedOrders > 0 && (
        <Link
          to="/admin/zambeel-export"
          className="flex items-center justify-between gap-3 bg-sand-100 border border-sand-300/50 rounded-sm px-4 py-3 mb-6 hover:bg-sand-100/70"
        >
          <span className="text-sm text-ink flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-sand-600" />
            {stats.unexportedOrders} new order{stats.unexportedOrders !== 1 ? 's are' : ' is'} ready for Zambeel export.
          </span>
          <span className="text-sm font-medium text-sand-600">Export now →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ClipboardList} label="Total orders" value={stats.totalOrders} tone="ink" />
        <StatCard icon={PackagePlus} label="New orders" value={stats.statusCounts.new} tone="palm" />
        <StatCard icon={Cog} label="Processing" value={stats.statusCounts.processing} tone="sand" />
        <StatCard icon={CheckCircle2} label="Delivered" value={stats.statusCounts.delivered} tone="palm" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.statusCounts.cancelled} tone="rust" />
        <StatCard icon={Wallet} label="Total sales" value={formatMoney(stats.totalSales, settings.currency)} tone="ink" />
        <StatCard icon={Boxes} label="Total products" value={stats.totalProducts} tone="ink" />
        <StatCard icon={FileSpreadsheet} label="Unexported orders" value={stats.unexportedOrders} tone="sand" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-ink mb-4">Order statuses</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink/50">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-sand-600" /> Low stock products
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-ink/50">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="py-2.5 flex justify-between text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className="text-rust-500 font-medium">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
