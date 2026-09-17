import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/catalogo', label: 'Catálogo de Libros', icon: 'auto_stories' },
  { path: '/lectura', label: 'Lectura Interactiva', icon: 'menu_book' },
  { path: '/recomendaciones', label: 'Recomendaciones IA', icon: 'psychology' },
  { path: '/historial', label: 'Historial & Movimientos', icon: 'history' },
]

function Sidebar({ userRole = 'Estudiante' }) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg">
      <div className="flex flex-col gap-space-md">
        <div className="px-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Navegación Principal
          </span>
        </div>
        <nav className="px-space-sm flex flex-col gap-space-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-lg text-label-lg bg-primary text-on-primary shadow-[0_1px_2px_rgba(9,20,38,0.05)] transition-all'
                  : 'flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all'
              }
            >
              <span className="material-symbols-outlined text-title-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="px-space-md flex flex-col gap-space-sm">
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Credencial</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface">
              {userRole}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-space-xs">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Conexión en línea</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
