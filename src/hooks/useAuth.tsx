import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getData } from '@/lib/api'
import { getToken, setToken } from '@/lib/auth'
import type { Student } from '@/types/api'

interface AuthContextValue {
  user: Student | null
  loading: boolean
  login: (id: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USERINFO_INTERVAL_MS = 5 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const data = getData<{ user: Student }>(await api.get('/userinfo'))
      setUser(data.user)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (!user) return
    const id = setInterval(refreshUser, USERINFO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [user, refreshUser])

  const login = useCallback(
    async (id: string, password: string) => {
      const res = await api.post<{ code: number; msg?: string; data?: { access_token: string } }>(
        '/login',
        { id, password }
      )
      const d = res.data
      if (d.code !== 200 || !d.data?.access_token) throw new Error(d.msg || '登录失败')
      setToken(d.data.access_token)
      await refreshUser()
    },
    [refreshUser]
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
