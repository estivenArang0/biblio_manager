import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function formatoFecha(value) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function textoDias(dias, estado) {
  if (estado === 'vencido') {
    const pasados = Math.abs(dias ?? 0)
    return pasados === 0 ? 'Vencido hoy' : `Vencido hace ${pasados} día${pasados === 1 ? '' : 's'}`
  }
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Queda 1 día'
  return `Quedan ${dias} días`
}

function MisPrestamos() {
  const [data, setData] = useState({ active: [], pending: [], loans: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progressBook, setProgressBook] = useState(null)
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const response = await api.myLoans()
      setData(response)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus préstamos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  const abrirAvance = async (loan) => {
    setProgressBook(loan)
    setProgress(null)
    setProgressLoading(true)
    try {
      const response = await api.readingProgress(loan.bookId)
      setProgress(response)
    } catch (err) {
      setProgress({ error: err.message || 'No se pudo cargar tu avance.' })
    } finally {
      setProgressLoading(false)
    }
  }

  if (loading) return <LoadingScreen label="Cargando tus préstamos…" />

  const visibles = [...data.pending, ...data.active]

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-5xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Estantería personal
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Mis préstamos
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Tus libros solicitados, disponibles para leer y vencidos.
        </p>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={cargar} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">auto_stories</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">
            Aún no tienes libros prestados
          </h2>
          <p className="text-body-sm text-on-surface-variant max-w-md">Pídelos en el catálogo.</p>
          <Link
            to="/catalogo"
            className="mt-2 min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-space-md" data-testid="mis-prestamos-lista">
          {visibles.map((loan) => {
            const vencido = loan.status === 'vencido'
            const pendiente = loan.status === 'pendiente'
            return (
              <article
                key={loan.id}
                data-testid={`prestamo-${loan.bookId}`}
                className={`bg-surface-container-lowest rounded-xl border shadow-sm overflow-hidden flex gap-3 p-3 ${
                  vencido ? 'border-red-300 ring-1 ring-red-100' : 'border-outline-variant/25'
                }`}
              >
                <img
                  src={loan.image}
                  alt={`Portada de ${loan.title}`}
                  className="w-20 h-28 object-cover rounded-lg bg-surface-container shrink-0"
                  loading="lazy"
                />
                <div className="flex flex-col justify-between min-w-0 flex-1 gap-2">
                  <div className="min-w-0">
                    <h2 className="font-title-md font-serif font-bold text-on-surface leading-tight line-clamp-2">
                      {loan.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{loan.author}</p>
                  </div>

                  <div className="flex flex-col gap-0.5 text-[11px] text-on-surface-variant">
                    <span>
                      {pendiente ? 'Solicitado' : `Límite: ${formatoFecha(loan.dueDate)}`}
                    </span>
                    {!pendiente && (
                      <span className={`font-semibold ${vencido ? 'text-red-700' : 'text-on-surface'}`}>
                        {textoDias(loan.daysLeft, loan.status)}
                      </span>
                    )}
                    <span
                      className={`w-fit mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        pendiente
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : vencido
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                      }`}
                    >
                      {pendiente ? 'Solicitado' : vencido ? 'Vencido' : 'Para leer'}
                    </span>
                  </div>

                  {loan.status === 'activo' && (
                    <Link
                      to={`/lectura/${loan.bookId}`}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
                      data-testid={`leer-${loan.bookId}`}
                    >
                      <span className="material-symbols-outlined text-base">menu_book</span>
                      <span>Leer</span>
                    </Link>
                  )}
                  {vencido && (
                    <button
                      type="button"
                      onClick={() => abrirAvance(loan)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold"
                      data-testid={`avance-${loan.bookId}`}
                    >
                      <span className="material-symbols-outlined text-base">trending_up</span>
                      <span>Ver mi avance</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {progressBook && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-title-md font-bold text-on-surface">Mi avance</h2>
                <p className="text-[11px] text-on-surface-variant">{progressBook.title}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setProgressBook(null)}
                className="w-11 h-11 -mr-2 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {progressLoading ? (
              <LoadingScreen label="Cargando avance…" />
            ) : progress?.error ? (
              <p className="text-xs text-on-error-container bg-error-container rounded-lg p-3">{progress.error}</p>
            ) : (
              <>
                {!progress?.hasContent ? (
                  <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                    Este libro no tiene contenido digital cargado.
                  </p>
                ) : (
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Página alcanzada</span>
                      <span className="font-bold text-on-surface">
                        {progress.page} de {progress.total}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container mt-2 overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="text-right text-[10px] text-on-surface-variant mt-1">{progress.percent}%</p>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-bold text-on-surface">Mis resaltados</h3>
                  {progress?.highlights?.length ? (
                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                      {progress.highlights.map((highlight) => (
                        <div key={highlight.id} className="text-[11px] rounded-lg bg-surface-container-low p-2">
                          <p className="text-on-surface line-clamp-2">“{highlight.text}”</p>
                          <p className="text-on-surface-variant mt-0.5">
                            Página {highlight.page + 1}
                            {highlight.note ? ` · Nota: ${highlight.note}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-on-surface-variant">No tienes resaltados en este libro.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MisPrestamos
