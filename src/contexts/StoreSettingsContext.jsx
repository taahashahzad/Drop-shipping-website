import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getStoreSettings, normalizeStoreSettings } from '../services/settingsService'

const StoreSettingsContext = createContext(null)

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => normalizeStoreSettings())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getStoreSettings()
      const storeSettings = normalizeStoreSettings(data)
      setSettings(storeSettings)
      if (storeSettings.store_name) document.title = storeSettings.store_name
      if (data?.favicon_url) {
        const link = document.querySelector("link[rel='icon']")
        if (link) link.href = data.favicon_url
      }
    } catch {
      // fall back to defaults if not yet configured
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext)
  if (!ctx) throw new Error('useStoreSettings must be used within StoreSettingsProvider')
  return ctx.settings
}

export function useStoreSettingsRefresh() {
  const ctx = useContext(StoreSettingsContext)
  if (!ctx) throw new Error('useStoreSettingsRefresh must be used within StoreSettingsProvider')
  return ctx.refresh
}
