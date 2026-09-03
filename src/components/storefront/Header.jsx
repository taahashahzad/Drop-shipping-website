import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Menu, X, Truck } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useStoreSettings } from '../../contexts/StoreSettingsContext'
import { getActiveCategories } from '../../services/categoryService'

export default function Header() {
  const settings = useStoreSettings()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    getActiveCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setMenuOpen(false)
    }
  }

  return (
    <div className={`sticky top-0 z-40 bg-paper/90 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-soft' : ''}`}>
      <div className="overflow-hidden bg-ink text-paper">
        <div className="rail flex animate-marquee gap-16 whitespace-nowrap py-1.5 text-[11px] tracking-wide">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-shrink-0 gap-16">
              {Array.from({ length: 4 }).map((__, j) => (
                <span key={j} className="flex items-center gap-2">
                  <Truck size={12} /> Cash on Delivery available across the UAE
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-ink/8">
        <div className="container-store flex items-center gap-4 py-4">
          <button className="text-ink lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex-shrink-0 font-display text-2xl font-semibold tracking-tight text-ink">
            {settings.store_name}
          </Link>

          <nav className="ml-6 hidden items-center gap-7 lg:flex">
            <Link to="/shop" className="link-underline text-sm text-ink-soft transition-colors hover:text-palm-600">
              Shop
            </Link>
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="link-underline text-sm text-ink-soft transition-colors hover:text-palm-600"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-md flex-1 md:flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="input rounded-full pr-10"
            />
            <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          <Link to="/cart" className="relative ml-auto flex-shrink-0 md:ml-0" aria-label="Cart">
            <div className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-ink/5">
              <ShoppingBag size={20} className="text-ink" />
            </div>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-palm-500 px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {menuOpen && (
          <div className="container-store space-y-4 pb-5 lg:hidden animate-fadeIn">
            <form onSubmit={handleSearch} className="relative flex">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="input rounded-full pr-10"
              />
              <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                <Search size={16} />
              </button>
            </form>
            <div className="flex flex-col divide-y divide-ink/5">
              <Link to="/shop" onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-medium text-ink">
                Shop all
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 text-sm text-ink-soft"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
