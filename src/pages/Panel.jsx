import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function Panel() {
  const [data, setData] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [panel, pendientes] = await Promise.all([api.panel(), api.pendingLoans()])
      setData(panel)
      setPending(pendientes.loans)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  const aprobar = async (loan) => {
    setBusy(loan.id)
    try {
      await api.approveLoan(loan.id)
      await cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <LoadingScreen label="Cargando panel…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Resumen de la biblioteca
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Panel</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Estado de préstamos, mensajes y circulación.</p>
      </header>

      {error && <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
        <article className="bg-surface-container-lowest rounded-xl border border-amber-200 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
              Solicitudes pendientes
            </span>
            <span className="text-3xl font-serif font-bold text-amber-700">{data?.solicitudesPendientes || 0}</span>
          </div>
          {pending.length === 0 ? (
            <p className="text-[11px] text-on-surface-variant">No hay solicitudes por aprobar.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pending.slice(0, 3).map((loan) => (
                <div key={loan.id} className="flex items-center gap-2 text-[11px]">
                  <span className="flex-1 min-w-0 truncate">
                    {loan.title} · {loan.user?.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => aprobar(loan)}
                    disabled={busy === loan.id}
                    className="min-h-[44px] px-2 rounded-lg bg-secondary text-on-secondary text-[10px] font-bold disabled:opacity-60"
                  >
                    {busy === loan.id ? '…' : 'Aprobar'}
                  </button>
                </div>
              ))}
            </div>
          )}
          <Link to="/prestamos" className="mt-auto text-[11px] font-semibold text-secondary hover:underline">
            Ver solicitudes
          </Link>
        </article>

        <Card
          label="Préstamos activos"
          value={data?.prestamosActivos}
          to="/prestamos"
          tone="text-green-700"
        />
        <Card
          label="Vencidos"
          value={data?.vencidos}
          to="/reportes?tab=vencidos"
          tone="text-red-700"
        />
        <Card
          label="Mensajes sin leer"
          value={data?.mensajesSinLeer}
          action={() => window.dispatchEvent(new Event('biblio:open-chat'))}
          actionLabel="Abrir chat"
          tone="text-secondary"
        />
        <Card
          label="Préstamos del mes"
          value={data?.prestamosDelMes}
          to="/reportes"
          tone="text-on-surface"
        />

        <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-4 flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
            Libros más prestados
          </span>
          <div className="flex flex-col gap-1">
            {(data?.librosMasPrestados || []).map((book) => (
              <div key={book.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-on-surface">{book.title}</span>
                <span className="font-mono text-on-surface-variant">{book.count}</span>
              </div>
            ))}
          </div>
          <Link to="/reportes" className="mt-auto text-[11px] font-semibold text-secondary hover:underline">
            Ver reportes
          </Link>
        </article>
      </section>
    </div>
  )
}

function Card({ label, value, to, action, actionLabel, tone }) {
  const content = (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-4 flex flex-col gap-2 h-full">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">{label}</span>
      <span className={`text-3xl font-serif font-bold ${tone}`}>{value ?? 0}</span>
      <span className="mt-auto text-[11px] font-semibold text-secondary">{actionLabel || 'Ver lista'}</span>
    </div>
  )
  if (action) {
    return (
      <button type="button" onClick={action} className="text-left">
        {content}
      </button>
    )
  }
  return (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  )
}

export default Panel
