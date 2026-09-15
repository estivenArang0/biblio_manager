import { useRef } from 'react'
import { recommendations } from '../data/content'
import RecommendationCard from './RecommendationCard'

function RecommendationsCarousel() {
  const scrollRef = useRef(null)

  const scrollBy = (offset) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="w-full mb-space-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-secondary mb-1">
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
              Conexión Semántica Cruzada
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Porque leíste "Ficciones" de J.L. Borges
          </h2>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            aria-label="Anterior"
            onClick={() => scrollBy(-320)}
            className="w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => scrollBy(320)}
            className="w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg overflow-x-auto scroll-smooth"
      >
        {recommendations.map((book) => (
          <RecommendationCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}

export default RecommendationsCarousel
