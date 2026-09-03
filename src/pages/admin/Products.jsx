import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package, ImageOff } from 'lucide-react'
import { getAllProductsForAdmin, deleteProduct, primaryImageOf, updateProduct } from '../../services/productService'
import { getAllCategories } from '../../services/categoryService'
import { formatMoney } from '../../utils/format'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { EmptyState, ConfirmDialog } from '../../components/Feedback'
import { useToast } from '../../contexts/ToastContext'

export default function Products() {
  const settings = useStoreSettings()
  const toast = useToast()
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function load() {
    setProducts(await getAllProductsForAdmin({ search, categoryId: categoryId || null }))
  }

  useEffect(() => {
    getAllCategories().then(setCategories)
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId])

  async function handleToggleActive(p) {
    await updateProduct(p.id, { is_active: !p.is_active })
    load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Product deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete product')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add product
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <input className="input pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        </div>
        <select className="input w-auto" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {products === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add your first product to start building your catalog."
          action={<Link to="/admin/products/new" className="btn-primary">Add product</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-ink/50 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {products.map((p) => {
                const image = primaryImageOf(p)
                return (
                  <tr key={p.id} className="hover:bg-paper-dim/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-paper-dim overflow-hidden flex-shrink-0">
                          {image ? (
                            <img src={image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink/25">
                              <ImageOff size={14} />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-ink line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{p.sku}</td>
                    <td className="px-4 py-3 text-ink/60">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-ink">{formatMoney(p.price, settings.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock <= 5 ? 'text-rust-500 font-medium' : 'text-ink'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`text-xs px-2 py-1 rounded-sm font-medium ${p.is_active ? 'bg-palm-50 text-palm-600' : 'bg-ink/5 text-ink/40'}`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/products/${p.id}`} className="text-ink/50 hover:text-palm-600">
                          <Pencil size={16} />
                        </Link>
                        <button onClick={() => setDeleteTarget(p)} className="text-ink/50 hover:text-rust-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" and all its images/variants will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
