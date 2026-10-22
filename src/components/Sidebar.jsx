import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const allNavItems = [
  { path: '/catalogo', label: 'Catálogo de Libros', icon: 'auto_stories', roles: ['Estudiante', 'Docente', 'Bibliotecario'] },
  { path: '/lectura', label: 'Lectura Interactiva', icon: 'menu_book', roles: ['Estudiante', 'Docente'] },
  { path: '/recomendaciones', label: 'Recomendaciones', icon: 'psychology', roles: ['Estudiante', 'Docente'] },
  { path: '/historial', label: 'Historial & Movimientos', icon: 'history', roles: ['Estudiante', 'Docente', 'Bibliotecario'] },
]

function Sidebar() {
  const [role, setRole] = useState('Estudiante')

  useEffect(() => {
    const sesion = localStorage.getItem('usuario_biblio')
    if (sesion) {
      try {
        const parsed = JSON.parse(sesion)
        if (parsed.rol) setRole(parsed.rol)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Filtrar los items de navegación según el rol activo
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between pt-space-md pb-space-lg select-none">
      <div className="flex flex-col gap-space-md">
        <div className="px-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Navegación Principal
          </span>
        </div>
        <nav className="px-space-sm flex flex-col gap-space-xs">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-space-sm px-space-md py-space-sm rounded-lg font-label-lg text-label-lg bg-primary text-on-primary shadow-[0_1px_2px_rgba(9,20,38,0.05)] transition-all font-medium'
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
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-space-xs border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Credencial activa</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary text-on-secondary font-semibold">
              {role}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-space-xs">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Conexión institucional segura</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar