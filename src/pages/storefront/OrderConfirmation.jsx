import { useLocation, useParams, Link } from 'react-router-dom'
import { CheckCircle2, Truck } from 'lucide-react'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { formatMoney } from '../../utils/format'

export default function OrderConfirmation() {
  const { reference } = useParams()
  const location = useLocation()
  const order = location.state?.order
  const settings = useStoreSettings()

  return (
    <div className="container-store mx-auto max-w-lg py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 animate-scaleIn items-center justify-center rounded-full bg-palm-50">
        <CheckCircle2 size={34} className="text-palm-500" />
      </div>
      <h1 className="animate-fadeUp font-display text-3xl font-medium">Order placed successfully</h1>
      <p className="mt-3 animate-fadeUp text-ink/55 animate-delay-100">
        Thank you! Your order <span className="font-semibold text-ink">{reference}</span> has been received.
      </p>

      <div className="card mt-8 animate-fadeUp p-5 text-left animate-delay-200">
        <div className="flex justify-between border-b border-ink/5 py-2 text-sm">
          <span className="text-ink/50">Order reference</span>
          <span className="font-medium text-ink">{reference}</span>
        </div>
        {order && (
          <>
            <div className="flex justify-between border-b border-ink/5 py-2 text-sm">
              <span className="text-ink/50">Delivery to</span>
              <span className="font-medium text-ink">{order.delivery_city}</span>
            </div>
            <div className="flex justify-between border-b border-ink/5 py-2 text-sm">
              <span className="text-ink/50">Total</span>
              <span className="font-medium text-ink">{formatMoney(order.total_amount, settings.currency)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between py-2 text-sm">
          <span className="text-ink/50">Payment mode</span>
          <span className="font-medium text-ink">Cash on Delivery</span>
        </div>
      </div>

      <div className="mt-7 flex animate-fadeUp items-center justify-center gap-2 text-sm text-palm-600 animate-delay-300">
        <Truck size={16} /> We'll deliver soon — pay in cash when it arrives.
      </div>

      <Link to="/shop" className="btn-primary mt-8 inline-flex animate-fadeUp rounded-full animate-delay-400">
        Continue shopping
      </Link>
    </div>
  )
}
