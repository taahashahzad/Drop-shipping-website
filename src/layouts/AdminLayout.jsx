import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  FileSpreadsheet,
  History,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useToast } from '../contexts/ToastContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/zambeel-export', label: 'Zambeel Export', icon: FileSpreadsheet },
  { to: '/admin/export-history', label: 'Export History', icon: History },
  { to: '/admin/settings', label: 'Store Settings', icon: Settings },
  { to: '/admin/account', label: 'Admin Account', icon: UserCircle },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const settings = useStoreSettings()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    toast.success('Logged out')
    navigate('/admin/login')
  }

  const NavItems = () => (
    <>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm text-sm font-medium transition-colors ${
              isActive ? 'bg-palm-500 text-white' : 'text-ink-soft hover:bg-ink/5'
            }`
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm text-sm font-medium text-rust-500 hover:bg-rust-500/5 mt-2"
      >
        <LogOut size={17} /> Logout
      </button>
    </>
  )

  return (
    <div className="min-h-screen flex bg-paper-dim">
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-ink/8 p-4 fixed h-screen">
        <div className="font-display text-lg font-semibold px-2 mb-6">{settings.store_name}</div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavItems />
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="font-display text-lg font-semibold">{settings.store_name}</span>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex flex-col gap-1">
              <NavItems />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-ink/8 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-display font-semibold">{settings.store_name} Admin</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
