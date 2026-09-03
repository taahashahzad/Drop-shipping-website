import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tags, ImageOff } from 'lucide-react'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  slugify,
} from '../../services/categoryService'
import { uploadFile, deleteFile, pathFromPublicUrl } from '../../services/storageService'
import { EmptyState, ConfirmDialog } from '../../components/Feedback'
import { useToast } from '../../contexts/ToastContext'

const EMPTY = { name: '', slug: '', description: '', is_active: true, image_url: '' }

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function load() {
    setCategories(await getAllCategories())
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setForm(EMPTY)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(cat) {
    setForm({ ...cat })
    setEditingId(cat.id)
    setModalOpen(true)
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadFile('category-images', file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        image_url: form.image_url || null,
        is_active: form.is_active,
      }
      if (editingId) {
        await updateCategory(editingId, payload)
        toast.success('Category updated')
      } else {
        await createCategory(payload)
        toast.success('Category created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.image_url) {
        const path = pathFromPublicUrl('category-images', deleteTarget.image_url)
        if (path) await deleteFile('category-images', path).catch(() => {})
      }
      await deleteCategory(deleteTarget.id)
      toast.success('Category deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete category')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Categories</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add category
        </button>
      </div>

      {categories === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Create your first category to start organizing products." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className="aspect-[16/9] bg-paper-dim">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/25">
                    <ImageOff size={22} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-ink">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${c.is_active ? 'bg-palm-50 text-palm-600' : 'bg-ink/5 text-ink/40'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-ink/45 mt-1 line-clamp-2">{c.description}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(c)} className="btn-outline flex-1 py-1.5 text-xs">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="btn-outline py-1.5 px-2.5 text-rust-500 border-rust-500/30">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={handleSave} className="card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-ink mb-4">{editingId ? 'Edit category' : 'New category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))}
                />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Image</label>
                {form.image_url && <img src={form.image_url} alt="" className="w-full h-28 object-cover rounded-sm mb-2" />}
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving || uploading} className="btn-primary">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this category?"
        description={`"${deleteTarget?.name}" will be removed. Products in this category will become uncategorized.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
