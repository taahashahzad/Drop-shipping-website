import { supabase } from '../lib/supabase'

const PRODUCT_SELECT = `
  *,
  category:categories(id, name, slug),
  product_images(id, image_url, is_primary, sort_order),
  product_variants(id, name, option_labels, sku, price, stock, image_url, is_active, sort_order)
`

export async function getProducts({
  page = 1,
  pageSize = 12,
  categorySlug = null,
  search = '',
  activeOnly = true,
  featuredOnly = false,
  sort = 'newest',
} = {}) {
  let query = supabase.from('products').select(PRODUCT_SELECT, { count: 'exact' })

  if (activeOnly) query = query.eq('is_active', true)
  if (featuredOnly) query = query.eq('is_featured', true)
  if (search) query = query.ilike('name', `%${search}%`)
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { products: data, total: count }
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getAllProductsForAdmin({ search = '', categoryId = null } = {}) {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  if (categoryId) query = query.eq('category_id', categoryId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Product images (unlimited, relational table)
// ---------------------------------------------------------------------------
export async function addProductImage(productId, imageUrl, { isPrimary = false, sortOrder = 0 } = {}) {
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, image_url: imageUrl, is_primary: isPrimary, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProductImage(imageId) {
  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) throw error
}

export async function setPrimaryImage(imageId) {
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (error) throw error
}

export async function reorderProductImages(orderedImageIds) {
  await Promise.all(
    orderedImageIds.map((id, index) =>
      supabase.from('product_images').update({ sort_order: index }).eq('id', id)
    )
  )
}

// ---------------------------------------------------------------------------
// Product variants
// ---------------------------------------------------------------------------
export async function addVariant(productId, payload) {
  const { data, error } = await supabase
    .from('product_variants')
    .insert({ ...payload, product_id: productId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVariant(variantId, payload) {
  const { data, error } = await supabase
    .from('product_variants')
    .update(payload)
    .eq('id', variantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVariant(variantId) {
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
  if (error) throw error
}

export function primaryImageOf(product) {
  const images = product?.product_images || []
  if (images.length === 0) return null
  const primary = images.find((i) => i.is_primary)
  return (primary || [...images].sort((a, b) => a.sort_order - b.sort_order)[0])?.image_url
}
