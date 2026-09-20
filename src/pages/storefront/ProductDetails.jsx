import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, RotateCcw, ImageOff, ChevronRight } from 'lucide-react'
import { getProductBySlug } from '../../services/productService'
import { formatMoney, discountPercent } from '../../utils/format'
import { useCart } from '../../contexts/CartContext'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { useToast } from '../../contexts/ToastContext'

export default function ProductDetails() {
  const { slug } = useParams()
  const settings = useStoreSettings()
  const { addItem } = useCart()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [variant, setVariant] = useState(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setProduct(null)
    window.scrollTo({ top: 0 })
    getProductBySlug(slug).then((p) => {
      setProduct(p)
      const images = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order)
      const primary = images.find((i) => i.is_primary) || images[0]
      setActiveImage(primary?.image_url || null)
      const activeVariants = (p.product_variants || []).filter((v) => v.is_active)
      setVariant(activeVariants[0] || null)
      setQty(1)
    })
  }, [slug])

  if (!product) {
    return (
      <div className="container-store animate-pulse py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square rounded-sm bg-ink/5" />
          <div className="space-y-3">
            <div className="h-6 w-2/3 rounded bg-ink/10" />
            <div className="h-4 w-1/3 rounded bg-ink/5" />
            <div className="h-10 w-1/2 rounded bg-ink/5" />
          </div>
        </div>
      </div>
    )
  }

  const images = [...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order)
  const variants = (product.product_variants || []).filter((v) => v.is_active)
  const price = variant?.price ?? product.price
  const stock = variant ? variant.stock : product.stock
  const pct = discountPercent(price, product.compare_at_price)

  function handleAddToCart() {
    if (stock <= 0) return
    addItem(product, variant, qty)
    toast.success('Added to cart')
  }

  return (
    <div className="container-store py-10">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-ink/40">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-ink/65">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-sm border border-ink/10 bg-paper-dim">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="h-full w-full object-cover transition-opacity duration-300" key={activeImage} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink/20">
                <ImageOff size={40} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm border-2 transition-colors ${
                    activeImage === img.image_url ? 'border-palm-500' : 'border-transparent hover:border-ink/15'
                  }`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category?.name && <p className="eyebrow mb-3 text-palm-600">{product.category.name}</p>}
          <h1 className="font-display text-3xl font-medium leading-tight sm:text-4xl">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink">{formatMoney(price, settings.currency)}</span>
            {product.compare_at_price > price && (
              <>
                <span className="text-base text-ink/40 line-through">{formatMoney(product.compare_at_price, settings.currency)}</span>
                {pct > 0 && <span className="text-sm font-semibold text-rust-500">-{pct}% off</span>}
              </>
            )}
          </div>

          {product.description && (
            <section className="mt-7 border-y border-ink/8 py-6" aria-labelledby="product-description-title">
              <p id="product-description-title" className="eyebrow text-palm-600">About this product</p>
              <p className="mt-3 whitespace-pre-line text-base font-medium leading-8 text-ink-soft">{product.description}</p>
            </section>
          )}

          {variants.length > 0 && (
            <div className="mt-7">
              <p className="label">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      variant?.id === v.id ? 'border-palm-500 bg-palm-50 text-palm-700' : 'border-ink/15 text-ink-soft hover:border-ink/30'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-ink/15">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 text-ink/60 hover:text-ink" aria-label="Decrease quantity">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(stock, q + 1))} className="p-2.5 text-ink/60 hover:text-ink" aria-label="Increase quantity">
                <Plus size={14} />
              </button>
            </div>
            <span className={`text-sm ${stock > 0 ? 'text-palm-600' : 'text-rust-500'}`}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <button onClick={handleAddToCart} disabled={stock <= 0} className="btn-primary mt-6 w-full rounded-full py-3.5 sm:w-auto sm:px-10">
            <ShoppingBag size={16} /> Add to cart
          </button>

          <div className="mt-9 grid grid-cols-1 gap-3 border-t border-ink/8 pt-7 sm:grid-cols-3">
            {[
              { icon: Truck, text: 'Cash on Delivery' },
              { icon: ShieldCheck, text: 'Quality checked' },
              { icon: RotateCcw, text: 'Easy returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-ink-soft">
                <Icon size={16} className="text-palm-500" /> {text}
              </div>
            ))}
          </div>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-9 border-t border-ink/8 pt-7">
              <h3 className="mb-3 text-sm font-semibold text-ink">Specifications</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-ink/5 py-2 text-sm">
                    <dt className="text-ink/50">{k}</dt>
                    <dd className="font-medium text-ink">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
