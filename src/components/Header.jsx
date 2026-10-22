import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState({ nombre: 'Elena Rostova', rol: 'Estudiante' })
  const searchInputRef = useRef(null)

  useEffect(() => {
    const sesion = localStorage.getItem('usuario_biblio')
    if (sesion) {
      try {
        const parsed = JSON.parse(sesion)
        setUser({
          nombre: parsed.nombre || 'Usuario TdeA',
          rol: parsed.rol || 'Estudiante',
        })
      } catch (e) {
        console.error(e)
      }
    }

    // Atajo de teclado global Ctrl+K o Cmd+K
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    // Redirigir al catálogo pasando el término de búsqueda
    navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario_biblio')
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none">
      <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-md">
        {/* Logo */}
        <div
          onClick={() => navigate('/catalogo')}
          className="flex items-center gap-space-sm min-w-[240px] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-sm bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-title-lg text-on-primary-container">
              local_library
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-serif font-bold">
            Biblio Manager
          </span>
        </div>

        {/* Buscador Global Activo */}
        <div className="flex-1 max-w-xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant pointer-events-none text-body-lg">
              search
            </span>
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-16 py-space-xs h-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-[0_1px_2px_rgba(9,20,38,0.05)] placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all"
              placeholder="Buscar por título, autor, signatura (presiona Enter)..."
              type="text"
            />
            <div className="absolute right-space-sm flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container font-label-sm text-[10px] text-on-surface-variant rounded border border-outline-variant/30 font-mono">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>

        {/* Perfil y Salida */}
        <div className="flex items-center gap-space-md min-w-[240px] justify-end">
          <button
            title="Cerrar sesión"
            onClick={handleLogout}
            className="p-space-xs rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
          >
            <span className="material-symbols-outlined text-title-lg">logout</span>
          </button>
          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-sm text-label-sm font-semibold uppercase">
              {user.nombre.substring(0, 2)}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-none capitalize font-medium">
                {user.nombre}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 leading-none">
                {user.rol}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header