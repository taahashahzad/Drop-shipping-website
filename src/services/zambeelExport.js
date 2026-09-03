// ============================================================================
// Zambeel Export Service
// ----------------------------------------------------------------------------
// This module is intentionally isolated from general order logic. It is NOT
// a generic Excel exporter — it produces exactly the 14-column Zambeel
// fulfillment format, in the exact column order and with the exact header
// names required by Zambeel's importer. Do not rename, reorder, add, or
// remove columns here.
// ============================================================================
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { markOrdersExported } from './orderService'

// The exact, required column order. Never change this array's order or values.
export const ZAMBEEL_COLUMNS = [
  'order_reference_id',
  'customer_name',
  'Address',
  'delivery_city',
  'delivery_country',
  'customer_phone_number',
  'product_sku',
  'Quantity',
  'price',
  'shipping_charges',
  'Discount',
  'total_amount',
  'currency',
  'payment_mode',
]

function buildFullAddress(order) {
  return [order.address_line, order.building, order.area].filter(Boolean).join(', ')
}

/**
 * Converts a list of orders (each with order_items already loaded) into
 * Zambeel row objects. One row is generated per order line item, so an
 * order with multiple products yields multiple rows — no line items are
 * ever dropped. Order-level shipping/discount/total are only carried on
 * the row for the first item of that order to avoid double counting when
 * the sheet is summed, matching how multi-item COD manifests are typically
 * read by fulfillment partners; every row still carries the correct SKU,
 * quantity and per-item price.
 */
export function buildZambeelRows(orders) {
  const rows = []

  for (const order of orders) {
    const items = order.order_items && order.order_items.length > 0 ? order.order_items : [
      {
        product_sku: 'N/A',
        quantity: 1,
        unit_price: order.total_amount,
      },
    ]

    items.forEach((item, index) => {
      rows.push({
        order_reference_id: order.order_reference,
        customer_name: order.customer_name,
        Address: buildFullAddress(order),
        delivery_city: order.delivery_city,
        delivery_country: order.delivery_country || 'United Arab Emirates',
        customer_phone_number: order.customer_phone,
        product_sku: item.product_sku,
        Quantity: item.quantity,
        price: Number(item.unit_price),
        shipping_charges: index === 0 ? Number(order.shipping_charges || 0) : 0,
        Discount: index === 0 ? Number(order.discount || 0) : 0,
        total_amount: index === 0 ? Number(order.total_amount) : 0,
        currency: order.currency || 'AED',
        payment_mode: order.payment_mode || 'COD',
      })
    })
  }

  return rows
}

export function generateZambeelWorkbook(orders) {
  const rows = buildZambeelRows(orders)
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: ZAMBEEL_COLUMNS })
  // Force the header row to exactly match the required columns/order.
  XLSX.utils.sheet_add_aoa(worksheet, [ZAMBEEL_COLUMNS], { origin: 'A1' })

  worksheet['!cols'] = [
    { wch: 18 }, // order_reference_id
    { wch: 22 }, // customer_name
    { wch: 30 }, // Address
    { wch: 14 }, // delivery_city
    { wch: 20 }, // delivery_country
    { wch: 16 }, // customer_phone_number
    { wch: 14 }, // product_sku
    { wch: 10 }, // Quantity
    { wch: 10 }, // price
    { wch: 14 }, // shipping_charges
    { wch: 10 }, // Discount
    { wch: 14 }, // total_amount
    { wch: 10 }, // currency
    { wch: 14 }, // payment_mode
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Zambeel Orders')
  return workbook
}

export function zambeelFilename(date = new Date()) {
  const iso = date.toISOString().slice(0, 10)
  return `Zambeel-Orders-${iso}.xlsx`
}

/**
 * Full export flow: generate workbook, trigger a browser download, record
 * the export + its included orders in zambeel_exports/zambeel_export_items,
 * then (only after the file was successfully generated) mark the orders as
 * exported. If anything before the download fails, no orders are touched.
 */
export async function exportOrdersToZambeel(orders, { markAsExported = true } = {}) {
  if (!orders || orders.length === 0) {
    throw new Error('No orders selected for export.')
  }

  const workbook = generateZambeelWorkbook(orders)
  const filename = zambeelFilename()

  // Generate the binary file first. If this throws, we bail before touching the DB.
  XLSX.writeFile(workbook, filename)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: exportRow, error: exportError } = await supabase
    .from('zambeel_exports')
    .insert({
      filename,
      order_count: orders.length,
      status: 'completed',
      exported_by: user?.id || null,
    })
    .select()
    .single()

  if (exportError) throw exportError

  const exportItems = orders.map((o) => ({ export_id: exportRow.id, order_id: o.id }))
  const { error: itemsError } = await supabase.from('zambeel_export_items').insert(exportItems)
  if (itemsError) throw itemsError

  if (markAsExported) {
    await markOrdersExported(orders.map((o) => o.id))
  }

  return { filename, exportId: exportRow.id, orderCount: orders.length }
}

export async function getExportHistory() {
  const { data, error } = await supabase
    .from('zambeel_exports')
    .select('*, zambeel_export_items(id, order:orders(order_reference, customer_name, total_amount))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
