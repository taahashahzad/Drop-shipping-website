import { supabase } from '../lib/supabase'

const DEFAULTS = {
  store_name: 'Mithai Ghar',
  store_description: 'Homemade Pakistani mithai, prepared fresh and delivered with care.',
  currency: 'PKR',
  shipping_fee: 250,
  free_shipping_threshold: 3000,
  footer_text: 'Homemade mithai, freshly prepared and delivered across Pakistan.',
  cod_enabled: true,
}

export function normalizeStoreSettings(data = {}) {
  const settings = { ...DEFAULTS, ...data }

  if (settings.store_name === 'Your Store' || settings.store_name === 'Cartlyst') {
    settings.store_name = DEFAULTS.store_name
  }
  if (/UAE|United Arab Emirates/i.test(settings.store_description || '')) {
    settings.store_description = DEFAULTS.store_description
  }
  if (/UAE|United Arab Emirates/i.test(settings.footer_text || '')) {
    settings.footer_text = DEFAULTS.footer_text
  }
  if (settings.currency === 'AED') {
    settings.currency = DEFAULTS.currency
    settings.shipping_fee = DEFAULTS.shipping_fee
    settings.free_shipping_threshold = DEFAULTS.free_shipping_threshold
  }

  return settings
}

export async function getStoreSettings() {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function updateStoreSettings(payload) {
  const { data, error } = await supabase
    .from('store_settings')
    .update(payload)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}
