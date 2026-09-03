import { useEffect, useState } from 'react'
import { getStoreSettings, updateStoreSettings } from '../../services/settingsService'
import { uploadFile } from '../../services/storageService'
import { useStoreSettingsRefresh } from '../../contexts/StoreSettingsContext'
import { useToast } from '../../contexts/ToastContext'

export default function StoreSettingsPage() {
  const refresh = useStoreSettingsRefresh()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => {
    getStoreSettings().then(setForm)
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleUpload(field, file, setBusy) {
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadFile('store-assets', file)
      set(field, url)
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateStoreSettings(form)
      await refresh()
      toast.success('Store settings updated')
    } catch (err) {
      toast.error(err.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <p className="text-sm text-ink/50">Loading…</p>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-medium mb-6">Store Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink mb-4">Store information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Store name</label>
              <input className="input" required value={form.store_name} onChange={(e) => set('store_name', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Store description</label>
              <textarea className="input" rows={2} value={form.store_description || ''} onChange={(e) => set('store_description', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input className="input" value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink mb-4">Branding</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="label">Logo</label>
              {form.logo_url && <img src={form.logo_url} alt="" className="h-12 mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => handleUpload('logo_url', e.target.files?.[0], setUploadingLogo)} disabled={uploadingLogo} className="text-sm" />
            </div>
            <div>
              <label className="label">Favicon</label>
              {form.favicon_url && <img src={form.favicon_url} alt="" className="h-8 mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => handleUpload('favicon_url', e.target.files?.[0], setUploadingFavicon)} disabled={uploadingFavicon} className="text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Footer text</label>
              <input className="input" value={form.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold text-ink mb-4">Shopping settings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <input className="input" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
            </div>
            <div>
              <label className="label">Shipping fee</label>
              <input className="input" type="number" step="0.01" min="0" value={form.shipping_fee} onChange={(e) => set('shipping_fee', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Free shipping threshold</label>
              <input className="input" type="number" step="0.01" min="0" value={form.free_shipping_threshold || ''} onChange={(e) => set('free_shipping_threshold', Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" checked={form.cod_enabled} onChange={(e) => set('cod_enabled', e.target.checked)} /> Cash on Delivery enabled
            </label>
          </div>
        </section>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
