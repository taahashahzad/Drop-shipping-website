import { supabase } from '../lib/supabase'

export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'processing',
  'exported_to_zambeel',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

export const STATUS_LABELS = {
  new: 'New',
  confirmed: 'Confirmed',
  processing: 'Processing',
  exported_to_zambeel: 'Exported to Zambeel',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

// cartItems: [{ product, variant, quantity }]
export async function placeOrder({ customer, cartItems, subtotal, shippingCharges, discount, total, currency = 'AED' }) {
  const orderId = crypto.randomUUID()
  const orderReference = `ORDER-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      order_reference: orderReference,
      customer_name: customer.fullName,
      customer_phone: customer.phone,
      customer_email: customer.email || null,
      address_line: customer.address,
      building: customer.building || null,
      area: customer.area || null,
      delivery_city: customer.city,
      emirate: customer.emirate || null,
      delivery_country: 'United Arab Emirates',
      delivery_notes: customer.notes || null,
      subtotal,
      shipping_charges: shippingCharges,
      discount,
      total_amount: total,
      currency,
      payment_mode: 'COD',
      status: 'new',
    })

  if (orderError) throw orderError

  const items = cartItems.map((item) => {
    const unitPrice = item.variant?.price ?? item.product.price
    const sku = item.variant?.sku || item.product.sku
    return {
      order_id: orderId,
      product_id: item.product.id,
      variant_id: item.variant?.id || null,
      product_name: item.product.name,
      product_sku: sku,
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: Number((unitPrice * item.quantity).toFixed(2)),
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(items)
  if (itemsError) throw itemsError

  return { id: orderId, order_reference: orderReference }
}

export async function getOrders({
  search = '',
  status = null,
  dateFrom = null,
  dateTo = null,
  zambeelFilter = null, // 'unexported' | 'exported' | null
  page = 1,
  pageSize = 20,
} = {}) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)
  if (zambeelFilter === 'unexported') query = query.eq('zambeel_exported', false)
  if (zambeelFilter === 'exported') query = query.eq('zambeel_exported', true)
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_reference.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { orders: data, total: count }
}

export async function getOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_history(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUnexportedOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('zambeel_exported', false)
    .in('status', ['new', 'confirmed', 'processing'])
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function markOrdersExported(orderIds) {
  const { error } = await supabase
    .from('orders')
    .update({
      zambeel_exported: true,
      zambeel_exported_at: new Date().toISOString(),
      status: 'exported_to_zambeel',
    })
    .in('id', orderIds)
  if (error) throw error
}

export async function getDashboardStats() {
  const [{ count: totalOrders }, { data: statusCounts }, { count: totalProducts }, { data: lowStock }, { count: unexported }] =
    await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('status'),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('id, name, stock').lte('stock', 5).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('zambeel_exported', false),
    ])

  const counts = { new: 0, confirmed: 0, processing: 0, exported_to_zambeel: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 }
  ;(statusCounts || []).forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1
  })

  const { data: salesData } = await supabase
    .from('orders')
    .select('total_amount, status')
    .not('status', 'in', '("cancelled","returned")')

  const totalSales = (salesData || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

  return {
    totalOrders: totalOrders || 0,
    statusCounts: counts,
    totalProducts: totalProducts || 0,
    lowStockProducts: lowStock || [],
    unexportedOrders: unexported || 0,
    totalSales,
  }
}
