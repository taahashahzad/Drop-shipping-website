import { supabase } from '../lib/supabase'

function randomName(file) {
  const ext = file.name.split('.').pop()
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}.${ext}`
}

export async function uploadFile(bucket, file, folder = '') {
  const path = folder ? `${folder}/${randomName(file)}` : randomName(file)
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

// Extract the storage path from a public URL so we can delete it later.
export function pathFromPublicUrl(bucket, publicUrl) {
  if (!publicUrl) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}
