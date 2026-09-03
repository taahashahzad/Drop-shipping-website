import { createContext, useContext, useEffect, useState, useMemo } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'cod_store_cart_v1'

function loadInitialCart() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function lineKey(productId, variantId) {
  return `${productId}::${variantId || 'base'}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors (private browsing, etc.)
    }
  }, [items])

  function addItem(product, variant, quantity = 1) {
    setItems((prev) => {
      const key = lineKey(product.id, variant?.id)
      const existing = prev.find((i) => lineKey(i.product.id, i.variant?.id) === key)
      if (existing) {
        return prev.map((i) =>
          lineKey(i.product.id, i.variant?.id) === key ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { product, variant: variant || null, quantity }]
    })
  }

  function removeItem(productId, variantId) {
    setItems((prev) => prev.filter((i) => lineKey(i.product.id, i.variant?.id) !== lineKey(productId, variantId)))
  }

  function updateQuantity(productId, variantId, quantity) {
    if (quantity <= 0) {
      removeItem(productId, variantId)
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        lineKey(i.product.id, i.variant?.id) === lineKey(productId, variantId) ? { ...i, quantity } : i
      )
    )
  }

  function clearCart() {
    setItems([])
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.variant?.price ?? i.product.price) * i.quantity, 0),
    [items]
  )

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
