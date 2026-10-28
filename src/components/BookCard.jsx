import { useState } from 'react'
import { Link } from 'react-router-dom'

function BookCard({ book, onEdit, onContent, onRequest, onFavorite, requesting, esStaff }) {
  const [showDetail, setShowDetail] = useState(false)

  const prestamo = book.myLoan
  const tienePrestamoActivo = prestamo?.status === 'activo' || prestamo?.status === 'vencido'
  const solicitudPendiente = prestamo?.status === 'pendiente'

  return (
    <>
      <article className="group flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-outline-variant/20 relative">
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-surface-container">
          <img
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            src={book.image}
            alt={`Portada de ${book.title}`}
            loading="lazy"
          />

          <div className="absolute top-space-sm left-space-sm flex flex-col gap-1 items-start max-w-[70%]">
            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-medium truncate">
              {book.tag || book.genre || 'General'}
            </span>
          </div>

          {esStaff && onEdit && (
            <button
              onClick={() => onEdit(book)}
              title="Editar información del libro"
              aria-label={`Editar ${book.title}`}
              className="absolute top-space-sm right-space-sm w-11 h-11 rounded-full bg-surface-container-lowest/95 backdrop-blur text-on-surface hover:text-secondary shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer z-10"
              type="button"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          )}
          {!esStaff && onFavorite && (
            <button
              onClick={() => onFavorite(book)}
              title={book.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              aria-label={book.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="absolute top-space-sm right-space-sm w-11 h-11 rounded-full bg-surface-container-lowest/95 backdrop-blur text-secondary shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer z-10"
              type="button"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: book.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          )}

          <div className="absolute bottom-space-sm left-space-sm right-space-sm flex justify-between items-end gap-2">
            <span className="px-2.5 py-1 rounded font-semibold text-[11px] bg-surface-container-lowest/95 backdrop-blur text-on-surface-variant">
              {book.availabilityLabel}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest/95 backdrop-blur font-mono text-[10px] text-on-surface-variant font-medium whitespace-nowrap">
              {book.format || 'Digital'}
            </span>
          </div>
        </div>

        <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-mono tracking-tight text-on-surface-variant truncate">
                {book.signature || 'BIB-S/N'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{book.year || '2025'}</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 group-hover:text-secondary transition-colors font-serif font-semibold">
              {book.title}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">{book.author}</p>
          </div>

          <div className="pt-space-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetail(true)}
                className="w-full min-h-[44px] py-1.5 px-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg transition-colors text-center cursor-pointer"
                type="button"
              >
                Ver ficha
              </button>
              {esStaff && onEdit && (
                <button
                  onClick={() => onEdit(book)}
                  title="Editar libro"
                  aria-label={`Editar ${book.title}`}
                  className="min-h-[44px] px-3 bg-surface-container-low hover:bg-surface-container text-secondary rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              )}
              {esStaff && onContent && (
                <button
                  onClick={() => onContent(book)}
                  title="Editar contenido de lectura"
                  aria-label={`Editar contenido de ${book.title}`}
                  className="min-h-[44px] px-3 bg-surface-container-low hover:bg-surface-container text-secondary rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                </button>
              )}
            </div>

            {!esStaff &&
              (prestamo?.status === 'activo' ? (
                <Link
                  to={`/lectura/${book.id}`}
                  className="w-full min-h-[44px] py-2 px-space-sm bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">menu_book</span>
                  <span>Leer</span>
                </Link>
              ) : tienePrestamoActivo ? (
                <Link
                  to="/mis-prestamos"
                  className="w-full min-h-[44px] py-2 px-space-sm bg-surface-container text-on-surface font-label-md text-label-md rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg text-secondary">event_busy</span>
                  <span>Ver mi avance</span>
                </Link>
              ) : solicitudPendiente ? (
                <button
                  disabled
                  className="w-full min-h-[44px] py-2 px-space-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span>Solicitado</span>
                </button>
              ) : (
                <button
                  onClick={() => onRequest(book)}
                  disabled={requesting}
                  className="w-full min-h-[44px] py-2 px-space-sm bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">bookmark_add</span>
                  <span>{requesting ? 'Enviando…' : 'Solicitar préstamo'}</span>
                </button>
              ))}
          </div>
        </div>
      </article>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-4 min-w-0">
                <img
                  className="w-20 h-28 object-cover rounded shadow shrink-0"
                  src={book.image}
                  alt={book.title}
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-title-lg text-on-surface font-bold leading-tight font-serif">
                    {book.title}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">{book.author}</p>
                  <span className="font-mono text-xs text-secondary mt-1">
                    Signatura: {book.signature || 'BIB-001'}
                  </span>
                  <span className="text-xs text-on-surface-variant">ISBN: {book.isbn || '—'}</span>
                  <span className="text-xs text-on-surface-variant">
                    Género: {book.tag || book.genre || 'Literatura'}
                  </span>
                  <span className="text-xs text-on-surface-variant">Formato: {book.format}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                aria-label="Cerrar ficha"
                className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              {book.description || 'Obra perteneciente al acervo bibliotecario de la institución.'}
            </p>

            <div className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-secondary">info</span>
              <span>
                {book.digital
                  ? 'Lectura digital habilitada solo con un préstamo activo y vigente.'
                  : 'Ejemplar físico: el préstamo se retira en la Biblioteca Central.'}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDetail(false)}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md cursor-pointer"
                type="button"
              >
                Cerrar
              </button>
              {esStaff && onEdit && (
                <button
                  onClick={() => {
                    setShowDetail(false)
                    onEdit(book)
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md flex items-center gap-1.5 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Editar obra</span>
                </button>
              )}
              {!esStaff && onRequest && prestamo?.status !== 'activo' && !solicitudPendiente && (
                <button
                  onClick={() => {
                    setShowDetail(false)
                    onRequest(book)
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md flex items-center gap-1.5 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">bookmark_add</span>
                  <span>Solicitar</span>
                </button>
              )}
              {!esStaff && prestamo?.status === 'activo' && (
                <Link
                  to={`/lectura/${book.id}`}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  <span>Leer</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookCard
