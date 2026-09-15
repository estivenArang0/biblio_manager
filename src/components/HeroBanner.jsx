import { useState } from 'react'
import { moods } from '../data/content'

function HeroBanner() {
  const [activeMood, setActiveMood] = useState(moods[0].id)

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-primary-container text-on-primary shadow-xl p-space-xl mb-space-xl">
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none"></div>
      <div className="absolute right-1/3 -bottom-24 w-80 h-80 rounded-full bg-secondary-container/10 blur-2xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-space-xl">
        <div className="flex flex-col max-w-3xl">
          <div className="flex items-center gap-space-xs mb-space-sm text-secondary-fixed">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
              Motor Semántico Neuronal v4.2
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-primary tracking-tight mb-space-sm">
            Descubre tu próxima gran lectura
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container max-w-2xl mb-space-lg">
            Sincronizamos tus hábitos de análisis, patrones de anotación y velocidad de lectura para sugerirte
            obras con profunda resonancia intelectual.
          </p>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider">
              ¿Qué impulso intelectual buscas hoy?
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {moods.map((mood) => {
                const isActive = mood.id === activeMood
                return (
                  <button
                    key={mood.id}
                    onClick={() => setActiveMood(mood.id)}
                    type="button"
                    className={
                      isActive
                        ? 'flex items-center gap-1.5 px-space-md py-2 rounded-full font-label-md text-label-md bg-secondary text-on-secondary shadow-sm transition-all duration-200 hover:scale-[1.02]'
                        : 'flex items-center gap-1.5 px-space-md py-2 rounded-full font-label-md text-label-md bg-tertiary-container text-on-primary-container hover:bg-surface-variant hover:text-primary transition-all duration-200'
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">{mood.icon}</span>
                    <span>{mood.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start xl:items-end gap-space-sm shrink-0">
          <button
            type="button"
            className="flex items-center gap-space-xs px-space-md py-3 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-bright font-label-md text-label-md shadow-md hover:shadow-lg transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
            <span>Reconfigurar mis intereses de lectura</span>
          </button>
          <span className="font-label-sm text-label-sm text-on-primary-container/80">
            Última sincronización: Hoy, 09:42 AM
          </span>
        </div>
      </div>
    </div>
  )
}

export default HeroBanner
