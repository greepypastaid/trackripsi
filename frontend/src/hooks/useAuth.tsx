import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../services/api'
import type { Response, User } from '../services/types'
import { AuthContext } from './useAuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api<Response<User>>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    tokenStore.set(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirm: string) => {
      const res = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: { name, email, password, password_confirmation: passwordConfirm },
      })
      tokenStore.set(res.token)
      setUser(res.user)
    },
    [],
  )

  const startGoogleLogin = useCallback(async () => {
    const res = await api<{ url: string }>('/auth/google/redirect')
    window.location.assign(res.url)
  }, [])

  const loginWithToken = useCallback(async (token: string) => {
    tokenStore.set(token)
    try {
      const res = await api<Response<User>>('/auth/me')
      setUser(res.data)
    } catch (err) {
      tokenStore.clear()
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, startGoogleLogin, loginWithToken, logout }),
    [user, loading, login, register, startGoogleLogin, loginWithToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
