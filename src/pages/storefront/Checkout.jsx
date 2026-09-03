import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Banknote } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { formatMoney } from '../../utils/format'
import { placeOrder } from '../../services/orderService'
import { useToast } from '../../contexts/ToastContext'

const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const settings = useStoreSettings()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    building: '',
    area: '',
    city: '',
    emirate: EMIRATES[0],
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const shipping = subtotal >= (settings.free_shipping_threshold || Infinity) ? 0 : Number(settings.shipping_fee || 0)
  const total = subtotal + shipping

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid phone number'
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) return
    if (!validate()) return

    setSubmitting(true)
    try {
      const order = await placeOrder({
        customer: form,
        cartItems: items,
        subtotal,
        shippingCharges: shipping,
        discount: 0,
        total,
        currency: settings.currency,
      })
      clearCart()
      navigate(`/order-confirmation/${order.order_reference}`, { state: { order } })
    } catch (err) {
      toast.error(err.message || 'Could not place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-store py-16 text-center">
        <p className="mb-4 text-ink/60">Your cart is empty.</p>
        <Link to="/shop" className="btn-primary rounded-full">Go to shop</Link>
      </div>
    )
  }

  return (
    <div className="container-store py-12">
      <h1 className="mb-8 font-display text-3xl font-medium">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-6 p-5 sm:p-7">
          <div>
            <h2 className="mb-4 font-semibold text-ink">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Full name</label>
                <input className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
                {errors.fullName && <p className="mt-1 text-xs text-rust-500">{errors.fullName}</p>}
              </div>
              <div>
                <label className="label">Phone number</label>
                <input className="input" placeholder="971501234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                {errors.phone && <p className="mt-1 text-xs text-rust-500">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input" placeholder="Street, area" value={form.address} onChange={(e) => set('address', e.target.value)} />
                {errors.address && <p className="mt-1 text-xs text-rust-500">{errors.address}</p>}
              </div>
              <div>
                <label className="label">Building / Villa</label>
                <input className="input" value={form.building} onChange={(e) => set('building', e.target.value)} />
              </div>
              <div>
                <label className="label">Area</label>
                <input className="input" value={form.area} onChange={(e) => set('area', e.target.value)} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
                {errors.city && <p className="mt-1 text-xs text-rust-500">{errors.city}</p>}
              </div>
              <div>
                <label className="label">Emirate</label>
                <select className="input" value={form.emirate} onChange={(e) => set('emirate', e.target.value)}>
                  {EMIRATES.map((em) => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Country</label>
                <input className="input bg-paper-dim" value="United Arab Emirates" disabled />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Delivery notes (optional)</label>
                <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-sm border border-palm-500/30 bg-palm-50 p-4">
            <Banknote size={20} className="flex-shrink-0 text-palm-600" />
            <div>
              <p className="text-sm font-semibold text-palm-700">Cash on Delivery Available</p>
              <p className="text-xs text-palm-700/70">Pay in cash when your order is delivered to your door.</p>
            </div>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-ink">Order Summary</h2>
          <div className="mb-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.variant?.id || 'base'}`} className="flex justify-between text-sm">
                <span className="line-clamp-1 pr-2 text-ink-soft">
                  {item.product.name} {item.variant ? `(${item.variant.name})` : ''} × {item.quantity}
                </span>
                <span className="flex-shrink-0 font-medium text-ink">
                  {formatMoney((item.variant?.price ?? item.product.price) * item.quantity, settings.currency)}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-ink/8 pt-3 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatMoney(shipping, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Payment mode</span>
              <span className="font-medium text-ink">Cash on Delivery</span>
            </div>
            <div className="flex justify-between border-t border-ink/8 pt-2.5 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoney(total, settings.currency)}</span>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full rounded-full py-3">
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
