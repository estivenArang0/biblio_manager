import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function formatoFecha(value) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
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

  if (loading) return <LoadingScreen label="Cargando tus préstamos…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Estantería personal
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Mis préstamos
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Préstamos activos, fechas límite y acceso a la lectura interactiva de tus libros digitales.
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

      {data.active.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">auto_stories</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">
            Aún no tienes libros prestados
          </h2>
          <p className="text-body-sm text-on-surface-variant max-w-md">
            Pídelos en el catálogo. Cuando el bibliotecario apruebe la solicitud aparecerán aquí con su fecha límite.
          </p>
          <Link
            to="/catalogo"
            className="mt-2 min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-space-md" data-testid="mis-prestamos-lista">
          {data.active.map((loan) => {
            const vencido = loan.status === 'vencido'
            const puedeLeer = loan.digital && !vencido
            const soloFisico = !loan.digital && !vencido
            return (
              <article
                key={loan.id}
                data-testid={`prestamo-${loan.bookId}`}
                className={`bg-surface-container-lowest rounded-xl border shadow-sm overflow-hidden flex gap-3 p-3 sm:p-4 ${
                  vencido ? 'border-red-300 ring-1 ring-red-100' : 'border-outline-variant/25'
                }`}
              >
                <img
                  src={loan.image}
                  alt={`Portada de ${loan.title}`}
                  className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg bg-surface-container shrink-0"
                  loading="lazy"
                />
                <div className="flex flex-col justify-between min-w-0 flex-1 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-title-md font-serif font-bold text-on-surface leading-tight line-clamp-2">
                        {loan.title}
                      </h2>
                      <span
                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          vencido
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}
                      >
                        {vencido ? 'Vencido' : 'Activo'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{loan.author}</p>
                    <p className="text-[11px] font-mono text-secondary mt-0.5">{loan.signature}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
                    <span>
                      <strong className="text-on-surface">Préstamo:</strong> {formatoFecha(loan.loanDate)}
                    </span>
                    <span>
                      <strong className="text-on-surface">Límite:</strong> {formatoFecha(loan.dueDate)}
                    </span>
                    <span className={`col-span-2 font-semibold ${vencido ? 'text-red-700' : 'text-on-surface'}`}>
                      {textoDias(loan.daysLeft, loan.status)}
                    </span>
                  </div>

                  {puedeLeer && (
                    <Link
                      to={`/lectura/${loan.bookId}`}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
                      data-testid={`leer-${loan.bookId}`}
                    >
                      <span className="material-symbols-outlined text-base">menu_book</span>
                      <span>Leer</span>
                    </Link>
                  )}
                  {soloFisico && (
                    <div className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold px-2 text-center">
                      <span className="material-symbols-outlined text-base text-secondary">storefront</span>
                      <span>Retirar en biblioteca</span>
                    </div>
                  )}
                  {vencido && (
                    <div className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold px-2 text-center">
                      <span className="material-symbols-outlined text-base">event_busy</span>
                      <span>Préstamo vencido: devuélvelo en biblioteca</span>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {data.pending.length > 0 && (
        <section className="flex flex-col gap-space-sm">
          <h2 className="font-title-md font-bold text-on-surface">Solicitudes pendientes</h2>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 divide-y divide-outline-variant/20">
            {data.pending.map((loan) => (
              <div key={loan.id} className="p-3 flex items-center gap-3">
                <img
                  src={loan.image}
                  alt={`Portada de ${loan.title}`}
                  className="w-10 h-14 object-cover rounded bg-surface-container"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface truncate">{loan.title}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{loan.author}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-semibold whitespace-nowrap">
                  En revisión
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default MisPrestamos
