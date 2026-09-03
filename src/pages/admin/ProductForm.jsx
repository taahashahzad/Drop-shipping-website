import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, Trash2, GripVertical, Plus, ImageOff, UploadCloud } from 'lucide-react'
import {
  getProductById,
  createProduct,
  updateProduct,
  addProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImages,
  addVariant,
  updateVariant,
  deleteVariant,
} from '../../services/productService'
import { getAllCategories } from '../../services/categoryService'
import { slugify } from '../../services/categoryService'
import { uploadFile, deleteFile, pathFromPublicUrl } from '../../services/storageService'
import { useToast } from '../../contexts/ToastContext'
import { ConfirmDialog } from '../../components/Feedback'

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  category_id: '',
  price: '',
  compare_at_price: '',
  stock: 0,
  is_active: true,
  is_featured: false,
  seo_title: '',
  seo_description: '',
  specifications: {},
}

const EMPTY_VARIANT = { name: '', sku: '', price: '', stock: 0, image_url: '', is_active: true }

export default function ProductForm() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [productId, setProductId] = useState(isNew ? null : id)
  const [images, setImages] = useState([])
  const [variants, setVariants] = useState([])
  const [specRows, setSpecRows] = useState([{ key: '', value: '' }])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [variantForm, setVariantForm] = useState(null)
  const [deleteImageTarget, setDeleteImageTarget] = useState(null)

  useEffect(() => {
    getAllCategories().then(setCategories)
    if (!isNew) {
      getProductById(id).then((p) => {
        setForm({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          description: p.description || '',
          category_id: p.category_id || '',
          price: p.price,
          compare_at_price: p.compare_at_price || '',
          stock: p.stock,
          is_active: p.is_active,
          is_featured: p.is_featured,
          seo_title: p.seo_title || '',
          seo_description: p.seo_description || '',
          specifications: p.specifications || {},
        })
        const specs = Object.entries(p.specifications || {})
        setSpecRows(specs.length ? specs.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }])
        setImages([...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order))
        setVariants(p.product_variants || [])
        setLoading(false)
      })
    }
  }, [id, isNew])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const specifications = {}
      specRows.forEach((row) => {
        if (row.key.trim()) specifications[row.key.trim()] = row.value
      })

      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        sku: form.sku,
        description: form.description,
        category_id: form.category_id || null,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        stock: Number(form.stock),
        is_active: form.is_active,
        is_featured: form.is_featured,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        specifications,
      }

      if (isNew) {
        const created = await createProduct(payload)
        setProductId(created.id)
        toast.success('Product created — you can now add images and variants.')
        navigate(`/admin/products/${created.id}`, { replace: true })
      } else {
        await updateProduct(productId, payload)
        toast.success('Product updated')
      }
    } catch (err) {
      toast.error(err.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (!productId) {
      toast.error('Save the product first, then add images.')
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const { url } = await uploadFile('product-images', file, productId)
        const img = await addProductImage(productId, url, {
          isPrimary: images.length === 0,
          sortOrder: images.length,
        })
        setImages((prev) => [...prev, img])
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`)
    } catch (err) {
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function confirmDeleteImage() {
    const img = deleteImageTarget
    if (!img) return
    try {
      await deleteProductImage(img.id)
      const path = pathFromPublicUrl('product-images', img.image_url)
      if (path) await deleteFile('product-images', path).catch(() => {})
      setImages((prev) => prev.filter((i) => i.id !== img.id))
      setDeleteImageTarget(null)
      toast.success('Image removed')
    } catch (err) {
      toast.error(err.message || 'Could not remove image')
    }
  }

  async function handleSetPrimary(imgId) {
    await setPrimaryImage(imgId)
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imgId })))
  }

  function moveImage(index, dir) {
    const next = [...images]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next)
    reorderProductImages(next.map((i) => i.id))
  }

  function addSpecRow() {
    setSpecRows((rows) => [...rows, { key: '', value: '' }])
  }

  function updateSpecRow(i, field, value) {
    setSpecRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  function removeSpecRow(i) {
    setSpecRows((rows) => rows.filter((_, idx) => idx !== i))
  }

  async function handleSaveVariant(e) {
    e.preventDefault()
    if (!productId) return
    try {
      const payload = {
        name: variantForm.name,
        sku: variantForm.sku,
        price: variantForm.price ? Number(variantForm.price) : null,
        stock: Number(variantForm.stock || 0),
        image_url: variantForm.image_url || null,
        is_active: variantForm.is_active,
        option_labels: {},
      }
      if (variantForm.id) {
        const updated = await updateVariant(variantForm.id, payload)
        setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
      } else {
        const created = await addVariant(productId, payload)
        setVariants((prev) => [...prev, created])
      }
      setVariantForm(null)
      toast.success('Variant saved')
    } catch (err) {
      toast.error(err.message || 'Could not save variant')
    }
  }

  async function handleDeleteVariant(variantId) {
    await deleteVariant(variantId)
    setVariants((prev) => prev.filter((v) => v.id !== variantId))
  }

  if (loading) return <p className="text-sm text-ink/50">Loading product…</p>

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/admin/products')} className="flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink mb-4">
        <ArrowLeft size={15} /> Back to products
      </button>
      <h1 className="text-2xl font-medium mb-6">{isNew ? 'Add product' : 'Edit product'}</h1>

      <form onSubmit={handleSaveProduct} className="card p-5 sm:p-6 space-y-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Product name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={() => !form.slug && set('slug', slugify(form.name))}
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" required value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" required value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Featured
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Price (AED)</label>
            <input className="input" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div>
            <label className="label">Compare-at price (optional)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" type="number" min="0" required value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Specifications</label>
            <button type="button" onClick={addSpecRow} className="text-xs text-palm-600 font-medium">+ Add row</button>
          </div>
          <div className="space-y-2">
            {specRows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" placeholder="Key (e.g. Battery)" value={row.key} onChange={(e) => updateSpecRow(i, 'key', e.target.value)} />
                <input className="input" placeholder="Value (e.g. 24h)" value={row.value} onChange={(e) => updateSpecRow(i, 'value', e.target.value)} />
                <button type="button" onClick={() => removeSpecRow(i)} className="text-ink/40 hover:text-rust-500 px-2">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-ink/8 pt-5">
          <div>
            <label className="label">SEO title</label>
            <input className="input" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} />
          </div>
          <div>
            <label className="label">SEO description</label>
            <input className="input" value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </form>

      {/* Images */}
      <div className="card p-5 sm:p-6 mb-6">
        <h2 className="font-semibold text-ink mb-1">Product images</h2>
        <p className="text-xs text-ink/50 mb-4">Upload as many images as you need. Set a primary image and drag order with the arrows.</p>

        {!productId ? (
          <p className="text-sm text-ink/45">Save the product first to add images.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={img.id} className="relative group card overflow-hidden">
                  <div className="aspect-square bg-paper-dim">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  {img.is_primary && (
                    <span className="absolute top-1.5 left-1.5 bg-palm-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    {!img.is_primary && (
                      <button type="button" onClick={() => handleSetPrimary(img.id)} className="text-white text-xs flex items-center gap-1 hover:underline">
                        <Star size={12} /> Set primary
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveImage(i, -1)} className="text-white text-xs hover:underline">← </button>
                      <button type="button" onClick={() => setDeleteImageTarget(img)} className="text-white text-xs flex items-center gap-1 hover:underline">
                        <Trash2 size={12} />
                      </button>
                      <button type="button" onClick={() => moveImage(i, 1)} className="text-white text-xs hover:underline"> →</button>
                    </div>
                  </div>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-full flex items-center justify-center gap-2 text-ink/35 py-8 border border-dashed border-ink/15 rounded-sm">
                  <ImageOff size={18} /> No images yet
                </div>
              )}
            </div>
            <label className="btn-outline inline-flex cursor-pointer">
              <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload images'}
              <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload} disabled={uploading} />
            </label>
          </>
        )}
      </div>

      {/* Variants */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-ink">Variants (optional)</h2>
          {productId && (
            <button
              type="button"
              onClick={() => setVariantForm({ ...EMPTY_VARIANT })}
              className="text-xs text-palm-600 font-medium flex items-center gap-1"
            >
              <Plus size={13} /> Add variant
            </button>
          )}
        </div>
        <p className="text-xs text-ink/50 mb-4">Use for color, size, model, storage, material, etc. Leave empty if this product has none.</p>

        {!productId ? (
          <p className="text-sm text-ink/45">Save the product first to add variants.</p>
        ) : variants.length === 0 ? (
          <p className="text-sm text-ink/45">No variants — this product will sell as a single option.</p>
        ) : (
          <div className="divide-y divide-ink/5">
            {variants.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{v.name}</p>
                  <p className="text-xs text-ink/50">
                    SKU {v.sku} · {v.price ? `AED ${v.price}` : 'Base price'} · Stock {v.stock}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={() => setVariantForm(v)} className="text-xs text-ink-soft hover:text-palm-600">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteVariant(v.id)} className="text-xs text-rust-500">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {variantForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={handleSaveVariant} className="card w-full max-w-sm p-5">
            <h3 className="font-semibold text-ink mb-4">{variantForm.id ? 'Edit variant' : 'New variant'}</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Variant name</label>
                <input className="input" required placeholder="e.g. Color: Black" value={variantForm.name} onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" required value={variantForm.sku} onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price override</label>
                  <input className="input" type="number" step="0.01" value={variantForm.price} onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input className="input" type="number" min="0" value={variantForm.stock} onChange={(e) => setVariantForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={variantForm.is_active} onChange={(e) => setVariantForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-ghost" onClick={() => setVariantForm(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteImageTarget}
        title="Remove this image?"
        confirmLabel="Remove"
        danger
        onConfirm={confirmDeleteImage}
        onCancel={() => setDeleteImageTarget(null)}
      />
    </div>
  )
}
