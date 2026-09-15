function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-variant/40">
      <div className="w-full h-16 px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md min-w-[240px]">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-secondary-fixed">auto_stories</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight leading-none">
              Biblio Manager
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-0.5">
              Plataforma de Lectura
            </span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-space-md">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant pointer-events-none text-[20px]">
              search
            </span>
            <input
              className="w-full h-10 pl-10 pr-space-md bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm rounded-lg border border-transparent focus:border-outline-variant focus:bg-surface-container-lowest focus:outline-none transition-all duration-150"
              placeholder="Buscar por título, autor, género o signatura topográfica..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-secondary-fixed/50 px-space-sm py-1 rounded-full text-secondary font-label-md text-label-md">
            <span className="text-[15px]">🔥</span>
            <span>14 días</span>
          </div>
          <button
            aria-label="Notificaciones"
            className="relative p-space-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <div className="h-6 w-px bg-outline-variant/30"></div>
          <div className="flex items-center gap-space-sm pl-space-xs">
            <div className="w-8 h-8 rounded-full ring-1 ring-outline-variant/40 bg-secondary-container flex items-center justify-center text-on-secondary-container font-label-sm text-label-sm font-semibold">
              ER
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-tight">Elena R.</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                Investigadora
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
