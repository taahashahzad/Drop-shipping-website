import { supabase } from '../lib/supabase'

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
