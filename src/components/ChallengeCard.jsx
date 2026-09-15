function ChallengeCard() {
  return (
    <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary/5 rounded-full pointer-events-none"></div>
      <div>
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[20px]">emoji_events</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary">
              Desafío Lector 2025
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed">
            62% Logrado
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-primary mb-1">15 de 24 libros completados</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
          Vas 2 tomos por delante del calendario para alcanzar tu meta anual.
        </p>
        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden mb-space-md">
          <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: '62.5%' }}></div>
        </div>
        <div className="flex items-center gap-space-sm p-space-sm bg-surface-container-low rounded-lg mb-space-sm">
          <div className="w-9 h-9 rounded-full bg-secondary-fixed/70 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[20px]">military_tech</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
              Insignia Desbloqueada
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Erudito de la Ficción Especulativa
            </span>
          </div>
        </div>
      </div>
      <div className="pt-space-xs border-t border-surface-container-high flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-1">
          Estrategia del mes:
        </span>
        <p className="font-body-sm text-body-sm text-on-surface">
          Lectura sugerida de 210 páginas para cerrar febrero cumpliendo el objetivo.
        </p>
      </div>
    </div>
  )
}

export default ChallengeCard
