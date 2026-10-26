import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import LoadingScreen from './LoadingScreen'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen label="Validando sesión…" />
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return children
}

export function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (!roles.includes(user.rol)) return <AccesoDenegado />
  return children
}

function AccesoDenegado() {
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-surface-container-lowest max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">block</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-error font-semibold">
            Error 403
          </span>
          <h1 className="font-headline-sm text-headline-sm font-serif font-bold text-on-surface">
            Acceso denegado
          </h1>
          <p className="text-body-sm text-on-surface-variant max-w-sm mt-1">
            Tu rol no tiene permisos para entrar a esta sección. Si crees que es un error,
            contacta al administrador del sistema.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            to="/catalogo"
            className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Ir al catálogo
          </Link>
          <Link
            to="/historial"
            className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
          >
            Ver mi historial
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AccesoDenegado
