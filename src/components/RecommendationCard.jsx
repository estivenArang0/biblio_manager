import { useState } from 'react'

function RecommendationCard({ book }) {
  const [inList, setInList] = useState(false)

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-space-md bg-surface-container">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={book.image}
            alt={`Portada de ${book.title}`}
          />
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-md text-on-primary font-label-sm text-label-sm flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-[14px] text-secondary-fixed">verified</span>
            <span>{book.affinity}% Afinidad</span>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm font-medium">
            {book.tag}
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors line-clamp-1">
            {book.title}
          </h3>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{book.author}</span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md">
          <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold mb-1">
            <span className="material-symbols-outlined text-[14px]">psychology_alt</span>
            <span>Análisis de IA:</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">{book.analysis}</p>
        </div>
      </div>

      <div className="flex items-center gap-space-sm pt-space-xs">
        <button
          onClick={() => setInList((prev) => !prev)}
          type="button"
          className={
            inList
              ? 'flex-1 py-2.5 px-space-md rounded-lg bg-secondary text-on-secondary font-label-md text-label-md flex items-center justify-center gap-1.5 hover:opacity-90 shadow-sm transition-colors'
              : 'flex-1 py-2.5 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container shadow-sm transition-colors'
          }
        >
          <span className="material-symbols-outlined text-[18px]">{inList ? 'check_circle' : 'bookmark_add'}</span>
          <span>{inList ? 'En tu lista' : 'Añadir a mi lista'}</span>
        </button>
        <button
          className="w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors"
          title="Muestra previa"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">visibility</span>
        </button>
      </div>
    </div>
  )
}

export default RecommendationCard
