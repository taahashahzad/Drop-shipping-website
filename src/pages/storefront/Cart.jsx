import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ImageOff, ArrowLeft } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { formatMoney } from '../../utils/format'
import { primaryImageOf } from '../../services/productService'
import { EmptyState } from '../../components/Feedback'

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart()
  const settings = useStoreSettings()

  const shipping = subtotal >= (settings.free_shipping_threshold || Infinity) ? 0 : Number(settings.shipping_fee || 0)
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="container-store py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the shop and add something you like — checkout is quick and Cash on Delivery is available."
          action={
            <Link to="/shop" className="btn-primary rounded-full">
              Start shopping
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-store py-12">
      <h1 className="font-display text-3xl font-medium mb-8">Your Cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => {
            const image = primaryImageOf(item.product) || item.variant?.image_url
            const price = item.variant?.price ?? item.product.price
            const maxStock = item.variant ? item.variant.stock : item.product.stock
            return (
              <div key={`${item.product.id}-${item.variant?.id || 'base'}`} className="card flex gap-4 p-4">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm bg-paper-dim">
                  {image ? (
                    <img src={image} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink/20">
                      <ImageOff size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${item.product.slug}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-palm-600">
                    {item.product.name}
                  </Link>
                  {item.variant && <p className="mt-0.5 text-xs text-ink/50">{item.variant.name}</p>}
                  <p className="mt-1.5 text-sm font-semibold text-ink">{formatMoney(price, settings.currency)}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-ink/15">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                        className="p-1.5 text-ink/60 hover:text-ink"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant?.id, Math.min(maxStock, item.quantity + 1))}
                        className="p-1.5 text-ink/60 hover:text-ink"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.product.id, item.variant?.id)} className="text-ink/35 hover:text-rust-500" aria-label="Remove item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <Link to="/shop" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-palm-600 hover:underline">
            <ArrowLeft size={14} /> Continue shopping
          </Link>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-ink">Order Summary</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatMoney(shipping, settings.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/8 pt-2.5 font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoney(total, settings.currency)}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary mt-5 w-full rounded-full py-3">
            Proceed to Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-ink/40">Cash on Delivery available</p>
        </div>
      </div>
    </div>
  )
}
