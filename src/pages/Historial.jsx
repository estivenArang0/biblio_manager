import { useState, useEffect, useMemo } from 'react'
import { escribirJSON, leerJSON, leerSesion, notificarCambioStorage } from '../utils/storage'

function Historial() {
  const [activeTab, setActiveTab] = useState('todos')
  const [periodo, setPeriodo] = useState('3_meses')
  const [solicitudes, setSolicitudes] = useState(() => leerJSON('solicitudes_prestamo', []))
  const [prestamos, setPrestamos] = useState(() => leerJSON('prestamos_biblio', []))
  const [librosCatalogo, setLibrosCatalogo] = useState(() =>
    leerJSON('catalogo_libros_agregados', [])
  )

  const usuario = leerSesion() ?? {}
  const esBibliotecario = usuario.rol === 'Bibliotecario'
  const userEmail = usuario.correo || usuario.email || 'estudiante@tdea.edu.co'

  // Releer el almacenamiento cuando otra pestaña (o la misma ventana) notifica
  // cambios. El setState ocurre dentro del evento, no al montar el efecto.
  useEffect(() => {
    const recargar = () => {
      setSolicitudes(leerJSON('solicitudes_prestamo', []))
      setPrestamos(leerJSON('prestamos_biblio', []))
      setLibrosCatalogo(leerJSON('catalogo_libros_agregados', []))
    }
    window.addEventListener('storage', recargar)
    return () => window.removeEventListener('storage', recargar)
  }, [])

  // Acción para devolver libro (Estudiante / Docente)
  const handleDevolver = (id) => {
    const actualizados = prestamos.map((it) =>
      it.id === id
        ? {
            ...it,
            statusLabel: 'Devuelto a sala',
            statusClass: 'bg-surface-container text-on-surface-variant',
            meta2: 'Devolución confirmada en sala',
          }
        : it
    )
    if (escribirJSON('prestamos_biblio', actualizados)) {
      setPrestamos(actualizados)
      notificarCambioStorage()
    }
  }

  // =========================================================================
  // VISTA 1: BITÁCORA DE AUDITORÍA Y ACCIONES (EXCLUSIVA BIBLIOTECARIO)
  // =========================================================================
  const accionesBibliotecario = useMemo(() => {
    const lista = []

    // 1. Solicitudes aprobadas o rechazadas gestionadas por el bibliotecario
    solicitudes.forEach((s) => {
      if (s.status === 'APROBADO') {
        lista.push({
          id: `sol-${s.id}`,
          title: `Préstamo Aprobado: ${s.title}`,
          sub: `Solicitante: ${s.userEmail} (${s.userRole || 'Estudiante'})`,
          date: s.date || 'Reciente',
          statusLabel: 'Aprobado',
          statusClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
          meta: `Plazo: ${s.plazo || 'Estándar'}`,
          meta2: s.signature || 'BIB-REG',
          icon: 'task_alt',
          tipo: 'aprobado',
          image: s.image,
        })
      } else if (s.status === 'RECHAZADO') {
        lista.push({
          id: `sol-${s.id}`,
          title: `Préstamo Rechazado: ${s.title}`,
          sub: `Solicitante: ${s.userEmail} (${s.userRole || 'Estudiante'})`,
          date: s.date || 'Reciente',
          statusLabel: 'Rechazado',
          statusClass: 'bg-rose-100 text-rose-900 border border-rose-300',
          meta: 'Disponibilidad restringida en sala',
          meta2: s.signature || 'BIB-REG',
          icon: 'cancel',
          tipo: 'rechazado',
          image: s.image,
        })
      }
    })

    // 2. Libros registrados en el acervo por el bibliotecario
    librosCatalogo.forEach((b) => {
      lista.push({
        id: `book-${b.id}`,
        title: `Obra Incorporada al Acervo: ${b.title}`,
        sub: `Autor: ${b.author} • Materia: ${b.tag || b.genre || 'General'}`,
        date: b.year || '2026',
        statusLabel: 'Registro de Acervo',
        statusClass: 'bg-blue-100 text-blue-900 border border-blue-300',
        meta: `Signatura: ${b.signature || 'BIB-001'}`,
        meta2: `Formato ${b.format || 'Digital'}`,
        icon: 'library_add',
        tipo: 'registro',
        image: b.image,
      })
    })

    return lista
  }, [solicitudes, librosCatalogo])

  const accionesFiltradasAdmin = useMemo(() => {
    if (activeTab === 'todos') return accionesBibliotecario
    if (activeTab === 'aprobados') return accionesBibliotecario.filter((a) => a.tipo === 'aprobado')
    if (activeTab === 'rechazados') return accionesBibliotecario.filter((a) => a.tipo === 'rechazado')
    if (activeTab === 'registros') return accionesBibliotecario.filter((a) => a.tipo === 'registro')
    return accionesBibliotecario
  }, [accionesBibliotecario, activeTab])

  // =========================================================================
  // VISTA 2: HISTORIAL PERSONAL (ESTUDIANTE / DOCENTE)
  // =========================================================================
  const misMovimientos = useMemo(() => {
    // Filtrar solo los movimientos pertenecientes al usuario conectado
    return prestamos
      .filter((item) => !item.userEmail || item.userEmail === userEmail)
      .map((item) => ({
        ...item,
        tipo: item.statusLabel?.toLowerCase().includes('devuelto')
          ? 'devolucion'
          : item.statusLabel?.includes('pts')
          ? 'terminado'
          : 'prestamo',
      }))
  }, [prestamos, userEmail])

  const movimientosFiltradosUsuario = useMemo(() => {
    if (activeTab === 'todos') return misMovimientos
    if (activeTab === 'prestamos')
      return misMovimientos.filter((m) => m.tipo === 'prestamo')
    if (activeTab === 'devoluciones')
      return misMovimientos.filter((m) => m.tipo === 'devolucion')
    if (activeTab === 'terminados')
      return misMovimientos.filter((m) => m.tipo === 'terminado')
    return misMovimientos
  }, [misMovimientos, activeTab])

  // Contadores métricos de usuario
  const prestamosActivosCount = misMovimientos.filter((i) => i.tipo === 'prestamo').length
  const librosLeidosCount = misMovimientos.filter((i) => i.tipo === 'terminado' || i.tipo === 'devolucion').length
  const horasLectura = Math.round(librosLeidosCount * 3.5)

  // =========================================================================
  // RENDER CONDICIONAL: BIBLIOTECARIO VS ESTUDIANTE/DOCENTE
  // =========================================================================
  if (esBibliotecario) {
    return (
      <div className="w-full px-gutter py-space-lg flex flex-col gap-space-lg max-w-[1520px] mx-auto select-none">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
                PANEL DE AUDITORÍA Y CONTROL
              </span>
              <span className="text-on-surface-variant/40">•</span>
              <span className="font-mono text-xs text-on-surface-variant">Sesión: {usuario.nombre || 'Bibliotecario General'}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif font-bold">
              Bitácora de Operaciones del Acervo
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-0.5">
              Registro trazable de préstamos aprobados, solicitudes denegadas e incorporaciones de nuevas obras al
              catálogo institucional.
            </p>
          </div>

          <div>
            <button
              onClick={() => alert('Exportando bitácora de auditoría administrativa en formato CSV e informe oficial...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Exportar Bitácora Administrativa</span>
            </button>
          </div>
        </header>

        {/* Métricas de Gestión Administrativa */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[11px] font-bold uppercase tracking-wider">PRÉSTAMOS APROBADOS</span>
              <span className="material-symbols-outlined text-xl text-emerald-600">task_alt</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-on-surface font-serif">
                {accionesBibliotecario.filter((a) => a.tipo === 'aprobado').length}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>Autorizados formalmente</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[11px] font-bold uppercase tracking-wider">SOLICITUDES DENEGADAS</span>
              <span className="material-symbols-outlined text-xl text-rose-600">cancel</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-on-surface font-serif">
                {accionesBibliotecario.filter((a) => a.tipo === 'rechazado').length}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                <span>Por reserva o cupo en sala</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[11px] font-bold uppercase tracking-wider">OBRAS REGISTRADAS</span>
              <span className="material-symbols-outlined text-xl text-secondary">library_add</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-on-surface font-serif">{librosCatalogo.length}</span>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                <span>Nuevas incorporaciones</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-[11px] font-bold uppercase tracking-wider">ESTADO DE BANDEJA</span>
              <span className="material-symbols-outlined text-xl text-blue-600">pending_actions</span>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-on-surface font-serif">
                {solicitudes.filter((s) => s.status === 'PENDIENTE').length} pendientes
              </span>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                <span>En cola de revisión</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pestañas de Filtrado Administrativo */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'todos' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todas las acciones ({accionesBibliotecario.length})
          </button>
          <button
            onClick={() => setActiveTab('aprobados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'aprobados' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Préstamos autorizados
          </button>
          <button
            onClick={() => setActiveTab('rechazados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rechazados' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Solicitudes rechazadas
          </button>
          <button
            onClick={() => setActiveTab('registros')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'registros' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Obras añadidas al acervo
          </button>
        </div>

        {/* Listado de Auditoría */}
        <section className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden border border-outline-variant/20">
          {accionesFiltradasAdmin.length > 0 ? (
            <div className="divide-y divide-outline-variant/15">
              {accionesFiltradasAdmin.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {acc.image ? (
                      <img src={acc.image} alt={acc.title} className="w-12 h-16 object-cover rounded bg-surface-container shrink-0 shadow-xs" />
                    ) : (
                      <div className="w-12 h-16 rounded bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-2xl">{acc.icon}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-on-surface truncate font-serif">{acc.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.statusClass}`}>
                          {acc.statusLabel}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant mt-0.5">{acc.sub}</span>
                      <div className="flex items-center gap-2.5 text-[11px] text-on-surface-variant/70 mt-1 font-mono flex-wrap">
                        <span>{acc.date}</span>
                        <span>•</span>
                        <span>{acc.meta}</span>
                        <span>•</span>
                        <span className="text-secondary font-semibold">{acc.meta2}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <span className="text-xs text-on-surface-variant/60 font-mono">Auditoría OK</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-2 text-secondary">admin_panel_settings</span>
              <p className="text-base font-semibold text-on-surface">No hay acciones registradas en esta categoría.</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Las solicitudes gestionadas o libros registrados se auditarán aquí automáticamente.
              </p>
            </div>
          )}
        </section>
      </div>
    )
  }

  // =========================================================================
  // VISTA ESTUDIANTE / DOCENTE
  // =========================================================================
  return (
    <div className="w-full px-gutter py-space-lg flex flex-col gap-space-lg max-w-[1520px] mx-auto select-none">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
              REGISTRO PERSONAL DE LECTURA
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-mono text-xs text-on-surface-variant">{userEmail}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif font-bold">
            Mi Historial & Préstamos
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-0.5">
            Registro personal de tus obras en préstamo activo, libros devueltos y puntos obtenidos en trivias de
            comprensión lectora.
          </p>
        </div>

        <div>
          <button
            onClick={() => alert('Generando informe personal de lectura en PDF...')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Descargar Certificado de Lectura</span>
          </button>
        </div>
      </header>

      {/* Tarjetas Métricas Personales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">OBRAS CONSULTADAS</span>
            <span className="material-symbols-outlined text-xl">menu_book</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-on-surface font-serif">{librosLeidosCount}</span>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              <span>En tu cuenta activa</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">TIEMPO ESTIMADO</span>
            <span className="material-symbols-outlined text-xl">schedule</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-on-surface font-serif">{horasLectura} hrs</span>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
              <span>Acumulado formativo</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">PRÉSTAMOS ACTIVOS</span>
            <span className="material-symbols-outlined text-xl text-amber-700">pending_actions</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-on-surface font-serif">{prestamosActivosCount} en curso</span>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
              <span className={`w-2 h-2 rounded-full ${prestamosActivosCount > 0 ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
              <span>{prestamosActivosCount > 0 ? 'Ejemplares en tu poder' : 'Sin préstamos pendientes'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider">ESTADO ACADÉMICO</span>
            <span className="material-symbols-outlined text-xl text-emerald-600">check_circle</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-on-surface font-serif">Al día</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-1 font-medium">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Sin sanciones ni multas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pestañas de Filtro para Usuario */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'todos' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos mis registros ({misMovimientos.length})
          </button>
          <button
            onClick={() => setActiveTab('prestamos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'prestamos' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Préstamos activos ({prestamosActivosCount})
          </button>
          <button
            onClick={() => setActiveTab('devoluciones')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'devoluciones' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Devoluciones realizadas
          </button>
          <button
            onClick={() => setActiveTab('terminados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'terminados' ? 'bg-black text-white shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Puntos y Trivias
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low text-xs rounded-lg text-on-surface font-medium border border-outline-variant/20">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_month</span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="3_meses">Últimos 3 meses</option>
              <option value="semestre">Semestre actual</option>
              <option value="anio">Año en curso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado de Movimientos del Usuario */}
      <section className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden border border-outline-variant/20">
        {movimientosFiltradosUsuario.length > 0 ? (
          <div className="divide-y divide-outline-variant/15">
            {movimientosFiltradosUsuario.map((item) => (
              <div
                key={item.id}
                className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded bg-surface-container shrink-0 shadow-xs"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-on-surface truncate font-serif">{item.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.tipo === 'devolucion'
                            ? 'bg-surface-container text-on-surface-variant'
                            : item.tipo === 'terminado'
                            ? 'bg-primary text-on-primary'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-0.5 truncate">{item.author}</span>
                    <div className="flex items-center gap-2.5 text-[11px] text-on-surface-variant/70 mt-1 font-mono flex-wrap">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span>{item.meta || 'BIB-001'}</span>
                      {item.meta2 && (
                        <>
                          <span>•</span>
                          <span className="text-secondary font-semibold">{item.meta2}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {item.tipo === 'prestamo' && (
                    <button
                      onClick={() => handleDevolver(item.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-xs font-semibold transition-colors cursor-pointer"
                      type="button"
                    >
                      Devolver libro
                    </button>
                  )}
                  <button
                    onClick={() => alert(`Certificado expedido para ${item.title}`)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-colors cursor-pointer"
                    type="button"
                  >
                    Ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-secondary">history_edu</span>
            <p className="text-base font-semibold text-on-surface">No tienes movimientos en este filtro.</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Pide un libro en el Catálogo o realiza lecturas interactivas para ver tus registros aquí.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Historial