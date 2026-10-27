import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

const SCOPE_TABS = [
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'docentes', label: 'Docentes' },
  { key: 'todos', label: 'Todos' },
]
const estadoClase = {
  activo: 'bg-green-100 text-green-800 border-green-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
  devuelto: 'bg-surface-container text-on-surface-variant border-outline-variant/30',
}
const estadoTexto = { activo: 'Activo', vencido: 'Vencido', devuelto: 'Devuelto' }

function fecha(value) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Reportes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const inicial = searchParams.get('tab')
  const [tipo, setTipo] = useState(
    ['prestamos', 'vencidos', 'comprension'].includes(inicial) ? inicial : 'prestamos'
  )
  const [scope, setScope] = useState('todos')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState({ rows: [], totals: { total: 0, activos: 0, vencidos: 0, devueltos: 0 } })
  const [activityData, setActivityData] = useState({
    rows: [],
    totals: { answered: 0, correct: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const cargar = useCallback(async () => {
    try {
      if (tipo === 'comprension') {
        const response = await api.reportActivities({ from, to })
        setActivityData(response)
      } else {
        const response = await api.report({
          scope,
          from,
          to,
          status: tipo === 'vencidos' ? 'vencido' : '',
        })
        setData(response)
      }
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo generar el reporte.')
    } finally {
      setLoading(false)
    }
  }, [tipo, scope, from, to])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- filtros disparan la consulta al API
    cargar()
  }, [cargar])

  const cambiarTipo = (next) => {
    setTipo(next)
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  const exportar = async () => {
    setExporting(true)
    try {
      if (tipo === 'comprension') {
        await api.downloadActivitiesCsv({ from, to })
      } else {
        await api.downloadReportCsv({
          scope,
          from,
          to,
          status: tipo === 'vencidos' ? 'vencido' : '',
        })
      }
    } catch (err) {
      setError(err.message || 'No se pudo exportar el CSV.')
    } finally {
      setExporting(false)
    }
  }

  if (loading && data.rows.length === 0 && activityData.rows.length === 0) {
    return <LoadingScreen label="Calculando reporte…" />
  }

  const descripcion =
    tipo === 'prestamos'
      ? 'Préstamos por tipo de lector, con filtros de fecha.'
      : tipo === 'vencidos'
        ? 'Préstamos vencidos por tipo de lector.'
        : 'Resultados de comprensión por lector y libro.'

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
            Analítica
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Reportes</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">{descripcion}</p>
        </div>
        <button
          type="button"
          onClick={exportar}
          disabled={exporting}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-sm disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">download</span>
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </header>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low w-full sm:w-fit overflow-x-auto">
        {[
          ['prestamos', 'Préstamos'],
          ['vencidos', 'Vencidos'],
          ['comprension', 'Comprensión lectora'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`reporte-${key}`}
            onClick={() => cambiarTipo(key)}
            className={`min-h-[44px] px-3 rounded-md text-xs font-semibold whitespace-nowrap ${
              tipo === key ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tipo !== 'comprension' && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low w-full sm:w-fit overflow-x-auto">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setScope(tab.key)}
              className={`min-h-[44px] px-3 rounded-md text-xs font-semibold whitespace-nowrap ${
                scope === tab.key
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                  : 'text-on-surface-variant'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {tipo === 'comprension' ? (
        <section className="grid grid-cols-2 gap-2 sm:gap-space-sm max-w-md">
          <Total label="Actividades" value={activityData.totals.answered} tone="text-on-surface" />
          <Total label="Aciertos trivia" value={activityData.totals.correct} tone="text-green-700" />
        </section>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-space-sm">
          <Total label="Total" value={data.totals.total} tone="text-on-surface" />
          <Total label="Activos" value={data.totals.activos} tone="text-green-700" />
          <Total label="Vencidos" value={data.totals.vencidos} tone="text-red-700" />
          <Total label="Devueltos" value={data.totals.devueltos} tone="text-on-surface-variant" />
        </section>
      )}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="fecha-desde">
            Desde
          </label>
          <input
            id="fecha-desde"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-on-surface-variant" htmlFor="fecha-hasta">
            Hasta
          </label>
          <input
            id="fecha-hasta"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
          />
        </div>
      </section>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {tipo === 'comprension' ? (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs" data-testid="tabla-comprension">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 font-semibold">Lector</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Libro</th>
                  <th className="px-3 py-2 font-semibold">Actividades</th>
                  <th className="px-3 py-2 font-semibold">Aciertos</th>
                  <th className="px-3 py-2 font-semibold">Porcentaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {activityData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-on-surface-variant">
                      No hay actividades que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  activityData.rows.map((row) => (
                    <tr key={`${row.user.id}-${row.book.id}`} className="hover:bg-surface-container-low/60">
                      <td className="px-3 py-2">
                        <span className="block font-semibold text-on-surface">{row.user.nombre}</span>
                        <span className="block text-[10px] text-on-surface-variant">{row.user.correo}</span>
                      </td>
                      <td className="px-3 py-2 capitalize">{row.user.tipoLector || '—'}</td>
                      <td className="px-3 py-2">{row.book.title}</td>
                      <td className="px-3 py-2 font-semibold">{row.answered}</td>
                      <td className="px-3 py-2">{row.correct}</td>
                      <td className="px-3 py-2 font-semibold text-secondary">{row.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 font-semibold">Lector</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Libro</th>
                  <th className="px-3 py-2 font-semibold">Préstamo</th>
                  <th className="px-3 py-2 font-semibold">Límite</th>
                  <th className="px-3 py-2 font-semibold">Devolución</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-on-surface-variant">
                      No hay préstamos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-container-low/60">
                      <td className="px-3 py-2">
                        <span className="block font-semibold text-on-surface">{row.user.nombre}</span>
                        <span className="block text-[10px] text-on-surface-variant">{row.user.correo}</span>
                      </td>
                      <td className="px-3 py-2 capitalize">{row.user.tipoLector || '—'}</td>
                      <td className="px-3 py-2">
                        <span className="block text-on-surface">{row.book.title}</span>
                        <span className="block text-[10px] text-on-surface-variant">{row.book.author}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(row.loanDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(row.dueDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fecha(row.returnedAt)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                            estadoClase[row.status] || estadoClase.devuelto
                          }`}
                        >
                          {estadoTexto[row.status] || row.status}
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
    </div>
  )
}

function Total({ label, value, tone }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3">
      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">{label}</span>
      <span className={`block font-headline-md font-serif font-bold ${tone}`}>{value}</span>
    </div>
  )
}

export default Reportes
