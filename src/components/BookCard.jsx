const toneClasses = {
  positive: 'bg-surface-container-lowest/95 backdrop-blur text-[11px] font-label-sm text-secondary font-semibold',
  neutral: 'bg-surface-container-lowest/95 backdrop-blur text-[11px] font-label-sm text-on-surface-variant font-medium',
  warning: 'bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-label-sm font-semibold',
}

function BookCard({ book }) {
  return (
    <article className="group flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-64 w-full overflow-hidden bg-surface-container">
        <img
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          src={book.image}
          alt={`Portada de ${book.title}`}
        />
        <div className="absolute top-space-sm left-space-sm flex flex-col gap-1 items-start">
          <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-medium">
            {book.tag}
          </span>
        </div>
        <div className="absolute bottom-space-sm left-space-sm right-space-sm flex justify-between items-end">
          <span className={`px-2.5 py-1 rounded ${toneClasses[book.availabilityTone]}`}>{book.availability}</span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest/95 backdrop-blur font-mono text-[10px] text-on-surface-variant font-medium">
            {book.format}
          </span>
        </div>
      </div>
      <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-label-sm font-mono tracking-tight text-on-surface-variant">
              {book.signature}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{book.year}</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 group-hover:text-secondary transition-colors">
            {book.title}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{book.author}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-secondary">
              <span className="material-symbols-outlined text-body-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="font-label-sm text-label-sm font-semibold ml-1">{book.rating}</span>
            </div>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{book.refs}</span>
          </div>
        </div>
        <div className="pt-space-sm flex items-center gap-space-xs">
          <button className="flex-1 py-2 px-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg transition-colors text-center" type="button">
            Ver detalle
          </button>
          <button className="flex-1 py-2 px-space-sm bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg shadow-xs transition-colors text-center" type="button">
            {book.reserveLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

export default BookCard
