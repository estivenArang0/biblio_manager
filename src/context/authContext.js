import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** 30 minutos sin actividad → cierre de sesión automático. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
