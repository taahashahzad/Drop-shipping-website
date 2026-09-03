import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, ShieldCheck, Banknote, Clock, ArrowRight, ArrowUpRight } from 'lucide-react'
import { getProducts } from '../../services/productService'
import { getActiveCategories } from '../../services/categoryService'
import ProductCard from '../../components/ProductCard'
import Reveal from '../../components/Reveal'
import { ProductGridSkeleton } from '../../components/Skeletons'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'

export default function Home() {
  const settings = useStoreSettings()
  const [featured, setFeatured] = useState(null)
  const [newArrivals, setNewArrivals] = useState(null)
  const [bestSellers, setBestSellers] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getProducts({ featuredOnly: true, pageSize: 5 }).then((r) => setFeatured(r.products))
    getProducts({ pageSize: 8, sort: 'newest' }).then((r) => setNewArrivals(r.products))
    getProducts({ pageSize: 4, sort: 'price_desc' }).then((r) => setBestSellers(r.products))
    getActiveCategories().then(setCategories)
  }, [])

  const heroImages = (featured || []).filter((p) => p.product_images?.length).slice(0, 3)

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative isolate flex min-h-[560px] items-center overflow-hidden sm:min-h-[640px]">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

        <div className="container-store relative py-20 sm:py-0">
          <div className="max-w-xl animate-fadeUp">
            <span className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sand-100 backdrop-blur-sm">
              Delivering across the UAE
            </span>
            <h1 className="font-display text-[2.75rem] font-medium leading-[1.05] text-white sm:text-6xl lg:text-[3.5rem]">
              Shop today,
              <br />
              pay at your door.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              {settings.store_description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop" className="btn bg-white text-palm-700 hover:bg-sand-100">
                Start shopping <ArrowRight size={16} />
              </Link>
              <Link to="/shop" className="btn border border-white/30 text-white hover:bg-white/10">
                Browse categories
              </Link>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-7">
              {[
                { icon: Banknote, label: 'Cash on Delivery' },
                { icon: ShieldCheck, label: 'Genuine products' },
                { icon: Clock, label: 'Fast dispatch' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-white/80">
                  <Icon size={16} /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {heroImages[0] && (
          <Link
            to={`/product/${heroImages[0].slug}`}
            className="group absolute bottom-8 right-8 hidden w-64 overflow-hidden rounded-sm border border-white/20 bg-white/10 p-3 backdrop-blur-md shadow-lift transition-transform duration-500 ease-smooth hover:-translate-y-1.5 lg:block"
          >
            <div className="aspect-square overflow-hidden rounded-sm">
              <img
                src={heroImages[0].product_images[0].image_url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
              />
            </div>
            <p className="mt-2.5 truncate text-xs font-medium text-white">{heroImages[0].name}</p>
            <p className="text-xs text-white/60">Featured this week</p>
          </Link>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-store py-20">
          <Reveal className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow text-palm-600">Browse</p>
              <h2 className="mt-2 text-3xl font-medium">Shop by category</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={(i % 4) * 100}>
                <Link
                  to={`/category/${c.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-sm border border-ink/10 bg-palm-50"
                >
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                    <span className="font-display text-lg text-white">{c.name}</span>
                    <ArrowUpRight size={18} className="text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container-store py-8">
        <Reveal className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow text-palm-600">Handpicked</p>
            <h2 className="mt-2 text-3xl font-medium">Featured products</h2>
          </div>
          <Link to="/shop" className="link-underline hidden text-sm font-medium text-palm-600 sm:inline-block">
            View all
          </Link>
        </Reveal>
        {featured === null ? (
          <ProductGridSkeleton />
        ) : featured.length === 0 ? (
          <p className="text-sm text-ink/50">No featured products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 100}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Promo banner */}
      <section className="container-store py-14">
        <Reveal className="relative overflow-hidden rounded-sm border border-sand-300/40 bg-sand-100 px-8 py-12 sm:px-14">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #DEC088 0%, transparent 70%)' }}
          />
          <div className="relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="eyebrow text-sand-600">Limited time</p>
              <h3 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">
                Free shipping over {settings.currency} {settings.free_shipping_threshold}
              </h3>
              <p className="mt-1 text-sm text-ink/60">On every order across the UAE — pay cash on delivery.</p>
            </div>
            <Link to="/shop" className="btn-primary flex-shrink-0">
              Shop now <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* New arrivals */}
      <section className="container-store py-8">
        <Reveal className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow text-palm-600">Just landed</p>
            <h2 className="mt-2 text-3xl font-medium">New arrivals</h2>
          </div>
          <Link to="/shop?sort=newest" className="link-underline hidden text-sm font-medium text-palm-600 sm:inline-block">
            View all
          </Link>
        </Reveal>
        {newArrivals === null ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 100}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Best sellers */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="container-store py-8 pb-8">
          <Reveal className="mb-8">
            <p className="eyebrow text-palm-600">Customer favorites</p>
            <h2 className="mt-2 text-3xl font-medium">Best sellers</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 100}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* COD info section */}
      <section className="mt-16 bg-ink text-paper">
        <div className="container-store py-20">
          <Reveal className="mb-14 text-center">
            <p className="eyebrow text-palm-300">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-medium text-white">Cash on Delivery, made simple</h2>
          </Reveal>
          <div className="relative grid gap-10 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-white/10 sm:block" />
            {[
              { n: '01', title: 'Place your order', text: 'Choose your products and check out — no card needed.' },
              { n: '02', title: 'We prepare & dispatch', text: 'Your order is packed and sent for delivery across the UAE.' },
              { n: '03', title: 'Pay on delivery', text: 'Pay cash to the courier when your order arrives.' },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 150} className="relative text-center">
                <div className="relative z-10 mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-ink font-display text-sm text-palm-300">
                  {step.n}
                </div>
                <h4 className="font-display text-lg text-white">{step.title}</h4>
                <p className="mx-auto mt-1.5 max-w-[220px] text-sm text-paper/55">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
