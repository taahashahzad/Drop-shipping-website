import { Link } from 'react-router-dom'
import { ImageOff, ShoppingBag } from 'lucide-react'
import { primaryImageOf } from '../services/productService'
import { formatMoney, discountPercent } from '../utils/format'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'

export default function ProductCard({ product }) {
  const settings = useStoreSettings()
  const { addItem } = useCart()
  const toast = useToast()

  const images = [...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order)
  const primary = primaryImageOf(product)
  const secondary = images.find((i) => i.image_url !== primary)?.image_url

  const pct = discountPercent(product.price, product.compare_at_price)
  const outOfStock = product.stock <= 0
  const hasVariants = (product.product_variants || []).some((v) => v.is_active)

  function handleQuickAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || hasVariants) return
    addItem(product, null, 1)
    toast.success('Added to cart')
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-ink/10 bg-white transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-ink/20 hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-dim">
        {primary ? (
          <>
            <img
              src={primary}
              alt={product.name}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                secondary ? 'group-hover:opacity-0' : 'group-hover:scale-[1.05]'
              }`}
            />
            {secondary && (
              <img
                src={secondary}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/20">
            <ImageOff size={32} />
          </div>
        )}

        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-rust-500 px-2 py-1 text-[11px] font-semibold text-white">
            -{pct}%
          </span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="rounded-sm border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-ink/70">
              Out of stock
            </span>
          </div>
        )}

        {!outOfStock && (
          <button
            onClick={handleQuickAdd}
            title={hasVariants ? 'Choose options on the product page' : 'Quick add to cart'}
            className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-ink text-paper opacity-0 shadow-soft transition-all duration-300 ease-smooth group-hover:translate-y-0 group-hover:opacity-100 hover:bg-palm-600"
          >
            <ShoppingBag size={15} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.category?.name && (
          <span className="eyebrow text-ink/40">{product.category.name}</span>
        )}
        <h3 className="text-sm font-medium leading-snug text-ink line-clamp-2">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5">
          <span className="text-base font-semibold text-ink">
            {formatMoney(product.price, settings.currency)}
          </span>
          {product.compare_at_price > product.price && (
            <span className="text-xs text-ink/40 line-through">
              {formatMoney(product.compare_at_price, settings.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
