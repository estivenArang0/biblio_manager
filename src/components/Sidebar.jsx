import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/authContext'

const ALL = ['Lector', 'Bibliotecario']
const READERS = ['Lector']
const STAFF = ['Bibliotecario']

const navItems = [
  { to: '/catalogo', label: 'Catálogo de libros', icon: 'auto_stories', roles: ALL },
  { to: '/mis-prestamos', label: 'Mis préstamos', icon: 'bookmark_added', roles: READERS },
  { to: '/prestamos', label: 'Panel de préstamos', icon: 'assignment_return', roles: STAFF },
  { to: '/lectura', label: 'Lectura interactiva', icon: 'menu_book', roles: READERS },
  { to: '/favoritos', label: 'Favoritos', icon: 'favorite', roles: READERS },
  { to: '/mis-notas', label: 'Mis notas', icon: 'sticky_note_2', roles: READERS },
  { to: '/comprension', label: 'Mi comprensión lectora', icon: 'insights', roles: READERS },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: 'psychology', roles: READERS },
  { to: '/historial', label: 'Historial', icon: 'history', roles: ALL },
  { to: '/perfil', label: 'Mi perfil', icon: 'account_circle', roles: ALL },
  { to: '/reportes', label: 'Reportes', icon: 'bar_chart', roles: STAFF },
  { to: '/chat', label: 'Chat con biblioteca', icon: 'forum', roles: READERS },
  { to: '/chat-bandeja', label: 'Chat · bandeja', icon: 'forum', roles: STAFF },
  { to: '/usuarios', label: 'Usuarios', icon: 'manage_accounts', roles: STAFF },
]

function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const role = user?.rol || 'Lector'
  const roleLabel = user?.tipoLector ? `${role} · ${user.tipoLector}` : role
  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between pt-space-md pb-space-lg overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-space-md">
          <div className="px-space-md flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
              Navegación principal
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="lg:hidden w-11 h-11 -mr-2 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="px-space-sm flex flex-col gap-space-xs">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-space-sm px-space-md min-h-[44px] py-2 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary shadow-[0_1px_2px_rgba(9,20,38,0.05)] transition-all font-medium'
                    : 'flex items-center gap-space-sm px-space-md min-h-[44px] py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all'
                }
              >
                <span className="material-symbols-outlined text-title-lg">{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="px-space-md flex flex-col gap-space-sm mt-space-md">
          <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-space-xs border border-outline-variant/20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Credencial activa</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary text-on-secondary font-semibold">
                {roleLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-label-sm text-[11px] text-on-surface-variant">
                Conexión institucional segura
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
