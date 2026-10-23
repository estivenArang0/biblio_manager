import { useState, useEffect } from 'react'
import { escribirJSON, leerJSON, notificarCambioStorage } from '../utils/storage'

function solicitudesPendientes() {
  return leerJSON('solicitudes_prestamo', []).filter((s) => s.status === 'PENDIENTE')
}

function PanelBibliotecario() {
  const [solicitudes, setSolicitudes] = useState(solicitudesPendientes)

  // Escuchar cambios de storage (misma ventana u otras pestañas). El estado se
  // actualiza dentro del evento, no durante el montaje del efecto.
  useEffect(() => {
    const cargarSolicitudes = () => setSolicitudes(solicitudesPendientes())
    window.addEventListener('storage', cargarSolicitudes)
    return () => window.removeEventListener('storage', cargarSolicitudes)
  }, [])

  const handleAprobar = (solicitud) => {
    try {
      // 1. Actualizar estado de la solicitud
      const todas = leerJSON('solicitudes_prestamo', [])
      const actualizadas = todas.map((s) =>
        s.id === solicitud.id ? { ...s, status: 'APROBADO' } : s
      )
      escribirJSON('solicitudes_prestamo', actualizadas)

      // 2. Registrar el préstamo formal en 'prestamos_biblio'
      const prestamos = leerJSON('prestamos_biblio', [])
      const nuevoPrestamo = {
        id: Date.now().toString(),
        bookId: solicitud.bookId,
        title: solicitud.title,
        author: solicitud.author,
        date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        statusLabel: 'Préstamo Activo',
        statusClass: 'bg-secondary-fixed text-on-secondary-fixed-variant',
        meta: solicitud.signature || 'BIB-GENERAL',
        meta2: `Plazo: ${solicitud.plazo} (${solicitud.userRole})`,
        image: solicitud.image,
        category: 'loans',
        userEmail: solicitud.userEmail,
        actions: ['Devolver', 'Renovar'],
      }
      escribirJSON('prestamos_biblio', [nuevoPrestamo, ...prestamos])

      setSolicitudes(solicitudesPendientes())
      // Disparar evento para que BookCard se entere si está en la misma ventana
      notificarCambioStorage()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRechazar = (solicitudId) => {
    try {
      const todas = leerJSON('solicitudes_prestamo', [])
      const actualizadas = todas.map((s) =>
        s.id === solicitudId ? { ...s, status: 'RECHAZADO' } : s
      )
      escribirJSON('solicitudes_prestamo', actualizadas)
      setSolicitudes(solicitudesPendientes())
      notificarCambioStorage()
    } catch (e) {
      console.error(e)
    }
  }

  if (solicitudes.length === 0) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary">inbox</span>
          <span className="text-body-sm text-on-surface-variant">
            Bandeja de solicitudes del Bibliotecario al día. No hay préstamos pendientes por autorizar.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-xs bg-surface-container font-mono text-on-surface">0 pendientes</span>
      </div>
    )
  }

  return (
    <div className="mb-8 p-5 rounded-xl bg-amber-50/80 border border-amber-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-950 font-bold font-title-md">
          <span className="material-symbols-outlined text-amber-700">pending_actions</span>
          <span>Bandeja de Aprobación de Préstamos ({solicitudes.length} pendientes)</span>
        </div>
        <span className="text-xs text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full font-medium">
          Rol: Bibliotecario
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {solicitudes.map((sol) => (
          <div
            key={sol.id}
            className="p-3.5 bg-surface-container-lowest rounded-lg border border-amber-200 shadow-sm flex flex-col justify-between gap-3"
          >
            <div className="flex gap-3">
              <img
                src={sol.image}
                alt={sol.title}
                className="w-12 h-16 object-cover rounded bg-surface-container shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <h4 className="font-semibold text-xs text-on-surface truncate" title={sol.title}>
                  {sol.title}
                </h4>
                <span className="text-[11px] text-on-surface-variant truncate">{sol.author}</span>
                <span className="text-[10px] text-secondary font-mono mt-0.5">{sol.signature}</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-medium text-on-surface">
                    {sol.userRole}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded truncate">
                    {sol.plazo}
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant/70 mt-1 truncate">
                  Usuario: {sol.userEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
              <button
                onClick={() => handleRechazar(sol.id)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface text-xs font-medium transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleAprobar(sol)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Aprobar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PanelBibliotecario