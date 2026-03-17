import { useCallback, useEffect, useState } from 'react'
import { api, getData } from '@/lib/api'
import type { SystemSettings } from '@/types/api'

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = getData<SystemSettings>(await api.get('/system_setting'))
      setSettings(data)
    } catch {
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { settings, loading, refresh }
}
