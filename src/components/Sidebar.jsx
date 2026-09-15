import { navItems } from '../data/content'

function Sidebar({ activePath }) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low/60 backdrop-blur-md border-r border-surface-variant/30 z-40 flex flex-col justify-between p-space-md">
      <div className="flex flex-col gap-space-lg">
        <div className="px-space-sm pt-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/80 font-semibold">
            Colecciones &amp; Módulos
          </span>
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = item.path === activePath
            return (
              <a
                key={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'flex items-center gap-space-sm px-space-md py-2.5 transition-colors bg-primary-container text-on-primary font-semibold rounded-lg'
                    : 'flex items-center gap-space-sm px-space-md py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-md text-label-md transition-colors'
                }
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-space-sm pt-space-md border-t border-surface-variant/30">
        <div className="px-space-sm flex items-center justify-between text-on-surface-variant">
          <span className="font-label-sm text-label-sm uppercase tracking-wider">Almacenamiento</span>
          <span className="font-label-sm text-label-sm">68%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div className="bg-secondary h-full rounded-full w-[68%]"></div>
        </div>
        <span className="px-space-sm font-label-sm text-label-sm text-on-surface-variant">
          34 de 50 tomos descargados
        </span>
      </div>
    </aside>
  )
}

export default Sidebar
