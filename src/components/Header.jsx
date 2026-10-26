import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

function Header({ onMenu }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (!searchTerm.trim()) return
    navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  const handleLogout = async () => {
    await logout('manual')
    navigate('/', { replace: true })
  }

  const nombre = user?.nombre || 'Usuario TdeA'
  const rol = user?.rol || 'Estudiante'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-3 sm:px-gutter flex items-center justify-between gap-2 sm:gap-space-md">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Abrir menú"
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="flex items-center gap-space-sm min-w-0 min-h-[44px] cursor-pointer"
          >
            <span className="w-8 h-8 rounded-sm bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-title-lg text-on-primary-container">
                local_library
              </span>
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-serif font-bold truncate">
              Biblio Manager
            </span>
          </button>
        </div>

        <div className="hidden md:block flex-1 max-w-xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full" role="search">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant pointer-events-none text-body-lg">
              search
            </span>
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-11 pr-16 py-space-xs h-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-[0_1px_2px_rgba(9,20,38,0.05)] placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="Buscar por título, autor o signatura…"
              type="search"
              aria-label="Buscar en el catálogo"
            />
            <div className="absolute right-space-sm flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container font-label-sm text-[10px] text-on-surface-variant rounded border border-outline-variant/30 font-mono">
                Ctrl K
              </kbd>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-1 sm:gap-space-sm justify-end min-w-0">
          <button
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={handleLogout}
            className="w-11 h-11 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-title-lg">logout</span>
          </button>
          <div className="flex items-center gap-space-sm pl-1 sm:pl-space-sm min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-sm text-label-sm font-semibold uppercase shrink-0">
              {nombre.substring(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="font-label-md text-label-md text-on-surface leading-none capitalize font-medium truncate max-w-[140px]">
                {nombre}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 leading-none">
                {rol}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
