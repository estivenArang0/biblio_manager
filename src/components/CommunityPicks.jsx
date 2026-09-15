import { useState } from 'react'
import { communityPicks } from '../data/content'

const filters = ['Mayor Calificación', 'Más Citados']

function CommunityPicks() {
  const [activeFilter, setActiveFilter] = useState(filters[0])

  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-space-xl shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-lg pb-space-sm border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-space-xs text-secondary mb-1">
            <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
              Comunidad Académica &amp; Lectora
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
            Lecturas Destacadas del Mes en la Biblioteca
          </h2>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Filtrar por:</span>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
              className={
                filter === activeFilter
                  ? 'px-space-sm py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors'
                  : 'px-space-sm py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors'
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {communityPicks.map((pick) => (
          <div
            key={pick.id}
            className="flex flex-col sm:flex-row gap-space-md p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <div className="w-full sm:w-28 h-40 shrink-0 rounded-lg overflow-hidden bg-surface-container shadow-sm">
              <img className="w-full h-full object-cover" src={pick.image} alt={`Portada de ${pick.title}`} />
            </div>
            <div className="flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between gap-space-xs mb-1">
                  <span className="font-headline-sm text-headline-sm text-primary">{pick.title}</span>
                  <div className="flex items-center gap-0.5 text-secondary font-label-md text-label-md font-bold">
                    <span
                      className="material-symbols-outlined text-[16px] text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span>{pick.rating}</span>
                    <span className="text-on-surface-variant font-normal text-[12px]">({pick.reviews})</span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-xs">
                  {pick.author}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface italic line-clamp-2 mb-space-sm">
                  "{pick.quote}"
                </p>
                <div className="flex items-center gap-space-xs text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-primary">{pick.reviewer}</span>
                  <span>· {pick.reviewerRole}</span>
                  <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-space-sm pt-space-xs">
                {pick.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface-variant"
                  >
                    {tag}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded bg-secondary-fixed/60 font-label-sm text-label-sm text-secondary font-semibold">
                  {pick.loans} préstamos activos
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommunityPicks
