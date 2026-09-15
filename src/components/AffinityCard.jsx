import { affinityBreakdown } from '../data/content'

function AffinityCard() {
  return (
    <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-secondary text-[22px]">analytics</span>
          <h2 className="font-headline-sm text-headline-sm text-primary">Afinidad del Perfil Lector</h2>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider bg-surface-container-low px-space-sm py-1 rounded-full">
          Muestra: 48 volúmenes analizados
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md items-center pt-space-xs">
        <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-secondary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="35, 100"
                strokeWidth="3.5"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="25, 100"
                strokeDashoffset="-35"
                strokeWidth="3.5"
              />
              <path
                className="text-surface-tint"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray="20, 100"
                strokeDashoffset="-60"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline-sm text-headline-sm text-primary leading-none">80%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">Top 3</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {affinityBreakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.colorClass}`}></span>
                <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-space-md rounded-lg bg-surface-container-low h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Ritmo de Lectura
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">speed</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-lg text-headline-lg text-primary font-bold">240</span>
            <span className="font-label-md text-label-md text-on-surface-variant">palabras / min</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-secondary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+18 ppm comparado al trimestre previo</span>
          </div>
        </div>

        <div className="flex flex-col justify-center p-space-md rounded-lg bg-surface-container-low h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Autor Recurrente
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">bookmark_heart</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary truncate">Jorge Luis Borges</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            7 obras leídas · 92 citas archivadas
          </span>
          <div className="flex items-center gap-1 mt-2 text-primary font-label-sm text-label-sm">
            <span className="font-semibold">Vínculo:</span>
            <span className="text-on-surface-variant">Laberintos, Metafísica</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AffinityCard
