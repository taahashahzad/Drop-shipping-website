import { useEffect, useState } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { SlidersHorizontal, ChevronRight } from 'lucide-react'
import { getProducts } from '../../services/productService'
import { getActiveCategories, getCategoryBySlug } from '../../services/categoryService'
import ProductCard from '../../components/ProductCard'
import Reveal from '../../components/Reveal'
import { ProductGridSkeleton } from '../../components/Skeletons'
import { EmptyState } from '../../components/Feedback'

const PAGE_SIZE = 12

export default function ProductListPage({ mode = 'shop' }) {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Number(searchParams.get('page') || 1)

  const [products, setProducts] = useState(null)
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [categoryLabel, setCategoryLabel] = useState('')

  useEffect(() => {
    getActiveCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setProducts(null)
    const params = { page, pageSize: PAGE_SIZE, sort }
    if (mode === 'category') params.categorySlug = slug
    if (mode === 'search') params.search = query

    getProducts(params).then((r) => {
      setProducts(r.products)
      setTotal(r.total)
    })

    if (mode === 'category') {
      getCategoryBySlug(slug).then((c) => setCategoryLabel(c.name)).catch(() => setCategoryLabel(''))
    }
  }, [mode, slug, query, sort, page])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const heading =
    mode === 'category' ? categoryLabel || 'Category' : mode === 'search' ? `Results for “${query}”` : 'Shop all products'

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="container-store py-12">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink/40">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <span className="text-ink/65">{heading}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 border-b border-ink/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">{heading}</h1>
          {products && <p className="mt-1.5 text-sm text-ink/45">{total} products</p>}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-ink/40" />
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="input w-auto rounded-full py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        {mode !== 'category' && (
          <aside className="hidden lg:block">
            <h3 className="mb-4 text-sm font-semibold text-ink">Categories</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/shop" className="link-underline block py-1 text-sm text-ink-soft hover:text-palm-600">
                  All products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/category/${c.slug}`} className="link-underline block py-1 text-sm text-ink-soft hover:text-palm-600">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className={mode === 'category' ? 'lg:col-span-2' : ''}>
          {products === null ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try a different search term or check back soon for new arrivals." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 4) * 80}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateParam('page', String(i + 1))}
                      className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                        page === i + 1 ? 'bg-palm-500 text-white' : 'border border-ink/10 bg-white text-ink-soft hover:border-ink/30'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
