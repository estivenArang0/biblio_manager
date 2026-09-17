function Header({ userName = 'Elena Rostova', userRole = 'Estudiante' }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm min-w-[240px]">
          <div className="w-8 h-8 rounded-sm bg-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-title-lg text-on-primary-container">local_library</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Biblio Manager</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant pointer-events-none text-body-lg">
              search
            </span>
            <input
              className="w-full pl-11 pr-16 py-space-xs h-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-[0_1px_2px_rgba(9,20,38,0.05)] placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest"
              placeholder="Buscar por título, autor, signatura..."
              type="text"
            />
            <div className="absolute right-space-sm flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-container font-label-sm text-label-sm text-on-surface-variant rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-md min-w-[240px] justify-end">
          <button className="relative p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-title-lg">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-sm text-label-sm font-semibold">
              {userName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-none">{userName}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 leading-none">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
