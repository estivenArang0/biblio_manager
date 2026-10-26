import { useCallback, useEffect, useState } from 'react'
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

function Prestamos() {
  const [pending, setPending] = useState([])
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [pendingData, loansData] = await Promise.all([api.pendingLoans(), api.allLoans()])
      setPending(pendingData.loans)
      setLoans(loansData.loans)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los préstamos.')
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

  const devolver = async (loan) => {
    setBusy(loan.id)
    try {
      await api.returnLoan(loan.id)
      await cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <LoadingScreen label="Cargando préstamos…" />

  const activos = loans.filter((loan) => loan.status === 'activo' || loan.status === 'vencido')

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Gestión bibliotecaria
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Préstamos y devoluciones
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Aprueba solicitudes y registra las devoluciones. Los plazos se asignan automáticamente: 8 días para
          estudiantes y 30 para docentes.
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

      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-title-md font-bold text-on-surface">Solicitudes por aprobar</h2>
          <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
            {pending.length} pendientes
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/25 flex items-center gap-3 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-secondary">inbox</span>
            No hay solicitudes pendientes.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm" data-testid="solicitudes-pendientes">
            {pending.map((loan) => (
              <article
                key={loan.id}
                className="bg-surface-container-lowest rounded-xl border border-amber-200 shadow-sm p-3 flex flex-col gap-3"
              >
                <div className="flex gap-3 min-w-0">
                  <img
                    src={loan.image}
                    alt={`Portada de ${loan.title}`}
                    className="w-14 h-20 object-cover rounded bg-surface-container shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-on-surface truncate">{loan.title}</h3>
                    <p className="text-[11px] text-on-surface-variant truncate">{loan.author}</p>
                    <p className="text-[10px] font-mono text-secondary mt-0.5">{loan.signature}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                      {loan.user?.nombre} · {loan.user?.rol}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/80 truncate">{loan.user?.correo}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                  <span className="flex-1 text-[10px] px-2 py-1 rounded bg-surface-container text-on-surface-variant self-center">
                    {loan.requestedDays} días
                  </span>
                  <button
                    type="button"
                    onClick={() => aprobar(loan)}
                    disabled={busy === loan.id}
                    className="min-h-[44px] px-3 rounded-lg bg-secondary text-on-secondary text-xs font-bold flex items-center gap-1 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {busy === loan.id ? 'Aprobando…' : 'Aprobar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-space-sm">
        <h2 className="font-title-md font-bold text-on-surface">Préstamos activos</h2>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 font-semibold">Usuario</th>
                  <th className="px-3 py-2 font-semibold">Libro</th>
                  <th className="px-3 py-2 font-semibold">Préstamo</th>
                  <th className="px-3 py-2 font-semibold">Límite</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {activos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-on-surface-variant">
                      No hay préstamos activos.
                    </td>
                  </tr>
                ) : (
                  activos.map((loan) => (
                    <tr key={loan.id} className="hover:bg-surface-container-low/60">
                      <td className="px-3 py-2">
                        <span className="block font-semibold text-on-surface">{loan.user?.nombre}</span>
                        <span className="block text-[10px] text-on-surface-variant">{loan.user?.correo}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block text-on-surface">{loan.title}</span>
                        <span className="block text-[10px] font-mono text-on-surface-variant">{loan.signature}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(loan.loanDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(loan.dueDate)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            loan.status === 'vencido'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => devolver(loan)}
                          disabled={busy === loan.id}
                          className="min-h-[44px] px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold disabled:opacity-60"
                        >
                          {busy === loan.id ? 'Registrando…' : 'Registrar devolución'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Prestamos
