import { useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

const estadoTexto = { activo: 'Activo', vencido: 'Vencido', devuelto: 'Devuelto', pendiente: 'Pendiente' }
const estadoClase = {
  activo: 'bg-green-100 text-green-800 border-green-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
  devuelto: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
  pendiente: 'bg-amber-100 text-amber-900 border-amber-200',
}

function fecha(value) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fechaHora(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Historial() {
  const { user } = useAuth()
  const [tab, setTab] = useState('prestamos')
  const [data, setData] = useState({ loans: [], events: [], scope: 'personal' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .history()
      .then((response) => {
        if (alive) setData(response)
      })
      .catch((err) => {
        if (alive) setError(err.message || 'No se pudo cargar el historial.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <LoadingScreen label="Cargando historial…" />

  const global = data.scope === 'global'

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          {global ? 'Auditoría global' : 'Actividad personal'}
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          {global ? 'Historial y movimientos' : 'Mi historial'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          {global
            ? 'Préstamos y aperturas de lectura registradas en todo el sistema.'
            : `Actividad de ${user?.nombre || 'tu cuenta'}: préstamos y sesiones de lectura.`}
        </p>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low w-full sm:w-fit">
        <button
          type="button"
          data-testid="tab-prestamos"
          onClick={() => setTab('prestamos')}
          className={`flex-1 sm:flex-none min-h-[44px] px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 ${
            tab === 'prestamos' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-base">library_books</span>
          Préstamos ({data.loans.length})
        </button>
        <button
          type="button"
          data-testid="tab-lectura"
          onClick={() => setTab('lectura')}
          className={`flex-1 sm:flex-none min-h-[44px] px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 ${
            tab === 'lectura' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-base">menu_book</span>
          Lectura ({data.events.length})
        </button>
      </div>

      {tab === 'prestamos' && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  {global && <th className="px-3 py-2 font-semibold">Usuario</th>}
                  <th className="px-3 py-2 font-semibold">Libro</th>
                  <th className="px-3 py-2 font-semibold">Préstamo</th>
                  <th className="px-3 py-2 font-semibold">Límite</th>
                  <th className="px-3 py-2 font-semibold">Devolución</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.loans.length === 0 ? (
                  <tr>
                    <td colSpan={global ? 6 : 5} className="px-3 py-10 text-center text-on-surface-variant">
                      Todavía no hay préstamos registrados.
                    </td>
                  </tr>
                ) : (
                  data.loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-surface-container-low/60">
                      {global && (
                        <td className="px-3 py-2">
                          <span className="block font-semibold text-on-surface">{loan.user?.nombre}</span>
                          <span className="block text-[10px] text-on-surface-variant">{loan.user?.rol}</span>
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <span className="block text-on-surface line-clamp-1">{loan.title}</span>
                        <span className="block text-[10px] text-on-surface-variant">{loan.author}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(loan.loanDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(loan.dueDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(loan.returnedAt)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                            estadoClase[loan.status] || estadoClase.devuelto
                          }`}
                        >
                          {estadoTexto[loan.status] || loan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'lectura' && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 divide-y divide-outline-variant/20">
          {data.events.length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant text-sm">
              Aún no hay aperturas de lectura registradas.
            </p>
          ) : (
            data.events.map((event) => (
              <div key={`${event.id}-${event.at}`} className="p-3 flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    event.event === 'open' ? 'bg-green-100 text-green-800' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {event.event === 'open' ? 'menu_book' : 'logout'}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-on-surface">
                    {event.event === 'open' ? 'Abrió' : 'Cerró'} «{event.title}»
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {global && event.user ? `${event.user.nombre} · ` : ''}
                    {fechaHora(event.at)}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">Folio digital</span>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}

export default Historial
