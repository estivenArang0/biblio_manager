import { useState } from 'react'
import { completedBooks, movementFilters, statCards, timelineEvents } from '../data/history'

function Historial() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [format, setFormat] = useState('pdf')
  const [exporting, setExporting] = useState(false)

  const visibleEvents =
    activeFilter === 'all' ? timelineEvents : timelineEvents.filter((e) => e.category === activeFilter)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setModalOpen(false)
      alert('Informe generado con éxito en formato ' + format.toUpperCase())
    }, 800)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-xl">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Registro Institucional</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Expediente ID: #AC-8849-2025</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Historial & Movimientos del Usuario</h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Auditoría cronológica de solicitudes de préstamo, devoluciones realizadas, reservas activas y obras
            consultadas en fondos físicos y repositorio digital.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start lg:self-auto">
          <button
            className="flex items-center gap-space-xs px-space-md py-2.5 bg-primary text-on-primary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all"
            onClick={() => setModalOpen(true)}
          >
            <span className="material-symbols-outlined text-body-lg">download</span>
            <span>Exportar informe en PDF / CSV</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
                {stat.label}
              </span>
              <span className={`material-symbols-outlined text-title-lg ${stat.iconColor}`}>{stat.icon}</span>
            </div>
            <div className="my-space-md">
              <span className="font-display-lg text-display-lg text-on-surface tracking-tight">
                {stat.value}{' '}
                {stat.unit && <span className="font-title-md text-title-md text-on-surface-variant font-normal">{stat.unit}</span>}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              {stat.noteIcon ? (
                <span className="material-symbols-outlined text-body-sm text-primary">{stat.noteIcon}</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
              )}
              <span className="font-body-sm text-body-sm">{stat.note}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Filtros */}
      <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0">
          {movementFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={
                activeFilter === f.value
                  ? 'px-space-md py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md transition-all whitespace-nowrap'
                  : 'px-space-md py-1.5 bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-lg font-label-md text-label-md transition-all whitespace-nowrap'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-space-sm flex-wrap lg:flex-nowrap">
          <div className="relative inline-flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-body-lg pointer-events-none">
              calendar_month
            </span>
            <select className="bg-surface-container-low text-on-surface font-label-md text-label-md pl-8 pr-8 py-2 rounded-lg appearance-none cursor-pointer focus:outline-none">
              <option value="1m">Último mes</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="ytd">Año actual</option>
              <option value="academic">Periodo académico completo</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-label-md pointer-events-none">expand_more</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-space-sm py-2 rounded-lg">
            <span>01 Ago 2025</span>
            <span>—</span>
            <span className="text-on-surface font-medium">24 Oct 2025</span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Registro Cronológico de Operaciones</h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{visibleEvents.length} eventos registrados</span>
        </div>
        <div className="relative pl-6 lg:pl-10 flex flex-col gap-space-md">
          <div className="absolute left-3 lg:left-5 top-4 bottom-8 w-0.5 bg-surface-container-highest"></div>
          {visibleEvents.map((event) => (
            <div key={event.id} className="relative flex items-start gap-space-md">
              <div className={`relative -left-6 lg:-left-10 flex items-center justify-center w-6 h-6 lg:w-10 lg:h-10 rounded-full shadow-sm ring-4 ring-surface shrink-0 z-10 ${event.iconBg}`}>
                <span className="material-symbols-outlined text-body-sm lg:text-body-lg">{event.icon}</span>
              </div>
              <div className="w-full bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-14 h-20 bg-surface-container shrink-0 rounded overflow-hidden shadow-sm hidden sm:block">
                    <img className="w-full h-full object-cover" src={event.image} alt={`Portada de ${event.title}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{event.date}</span>
                      <span className="text-outline-variant">•</span>
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-md font-medium ${event.statusClass}`}>
                        {event.statusLabel}
                      </span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold">{event.title}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">{event.author}</p>
                    <div className="flex items-center gap-space-sm pt-1">
                      <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">{event.meta}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{event.meta2}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
                  {event.actions.map((action) => (
                    <button key={action} className="px-space-md py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-label-md text-label-md transition-colors">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Libros completados */}
      <section className="flex flex-col gap-space-md mt-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-xs">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Libros completados recientemente</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Registro formal de obras finalizadas por el usuario en sesiones presenciales o digitales.
            </p>
          </div>
          <a className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-1" href="#">
            <span>Ver registro completo de lecturas</span>
            <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
          {completedBooks.map((book) => (
            <div key={book.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-md group hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-space-sm">
                <div className="w-full aspect-[2/3] bg-surface-container rounded-lg overflow-hidden relative shadow-sm">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={book.image} alt={`Portada de ${book.title}`} />
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-surface/90 backdrop-blur rounded font-label-sm text-label-sm text-on-surface">
                    {book.format}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{book.finishedDate}</span>
                  <h4 className="font-title-md text-title-md text-on-surface font-semibold line-clamp-1">{book.title}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{book.author}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-space-xs">
                <button className="w-full py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg font-label-sm text-label-sm transition-colors">
                  Volver a consultar
                </button>
                <button className="w-full py-1 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-colors text-center">
                  Ver notas ({book.notes})
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de exportación */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg max-w-md w-full mx-space-md shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-headline-sm">file_download</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Exportar informe de auditoría</h3>
              </div>
              <button className="p-1 text-on-surface-variant hover:text-on-surface rounded-md" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Seleccione el formato oficial para el registro de préstamos, horas acumuladas y estado de devoluciones.
            </p>
            <div className="flex flex-col gap-space-sm">
              <label className="flex items-center gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container">
                <input checked={format === 'pdf'} onChange={() => setFormat('pdf')} className="accent-primary" name="exportFormat" type="radio" value="pdf" />
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">Documento Oficial PDF</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Incluye membrete institucional y firma digital</span>
                </div>
              </label>
              <label className="flex items-center gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container">
                <input checked={format === 'csv'} onChange={() => setFormat('csv')} className="accent-primary" name="exportFormat" type="radio" value="csv" />
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">Dataset en CSV (Comma Separated)</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Para análisis estadístico en software externo</span>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button className="px-space-md py-2 text-on-surface-variant hover:text-on-surface font-label-md text-label-md rounded-lg" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button
                className="px-space-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Procesando...' : 'Generar y descargar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Historial
