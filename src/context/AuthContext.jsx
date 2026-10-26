import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../services/api'
import { AuthContext, IDLE_TIMEOUT_MS } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let alive = true
    async function restore() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const data = await api.me()
        if (alive) setUser(data.user)
      } catch {
        clearToken()
        if (alive) setUser(null)
      } finally {
        if (alive) setLoading(false)
      }
    }
    restore()
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (correo, password) => {
    const data = await api.login(correo, password)
    setToken(data.token)
    setUser(data.user)
    setNotice('')
    return data.user
  }, [])

  const logout = useCallback(async (reason = 'manual') => {
    // Permite que componentes con estado efímero (p. ej. el visor de lectura)
    // registren su cierre mientras el token todavía es válido y terminarlo
    // antes de borrar la sesión.
    const pendientes = []
    window.dispatchEvent(
      new CustomEvent('biblio:before-logout', {
        detail: { waitUntil: (promise) => pendientes.push(Promise.resolve(promise)) },
      })
    )
    await Promise.allSettled(pendientes)
    try {
      if (getToken()) await api.logout()
    } catch {
      /* la sesión local se cierra igual */
    }
    clearToken()
    setUser(null)
    if (reason === 'idle') {
      setNotice('Tu sesión venció por inactividad')
    } else if (reason === 'expired') {
      setNotice('Tu sesión venció por inactividad')
    } else {
      setNotice('')
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    let timer = null
    const reset = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => logout('idle'), IDLE_TIMEOUT_MS)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }))
    reset()
    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [user, logout])

  useEffect(() => {
    const onExpired = () => {
      clearToken()
      setUser(null)
      setNotice('Tu sesión venció por inactividad')
    }
    window.addEventListener('biblio:session-expired', onExpired)
    return () => window.removeEventListener('biblio:session-expired', onExpired)
  }, [])

  const value = useMemo(
    () => ({ user, loading, notice, login, logout, setNotice }),
    [user, loading, notice, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
