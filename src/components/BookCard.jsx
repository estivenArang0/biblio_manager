import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { escribirJSON, leerJSON, leerSesion, notificarCambioStorage } from '../utils/storage'
import { generarId } from '../utils/text'

const toneClasses = {
  positive: 'bg-surface-container-lowest/95 backdrop-blur text-[11px] font-label-sm text-secondary font-semibold',
  neutral: 'bg-surface-container-lowest/95 backdrop-blur text-[11px] font-label-sm text-on-surface-variant font-medium',
  warning: 'bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-label-sm font-semibold',
}

const mismoLibro = (registro, book) =>
  registro.bookId === book.id ||
  registro.title?.toLowerCase().trim() === book.title?.toLowerCase().trim()

/**
 * Estado de este usuario frente a este libro:
 * APROBADO (préstamo activo), PENDIENTE (solicitud en revisión) o DISPONIBLE.
 */
function calcularEstadoPrestamo(book, userEmail) {
  const prestamos = leerJSON('prestamos_biblio', [])
  const yaPrestado = prestamos.some(
    (p) =>
      mismoLibro(p, book) &&
      p.userEmail === userEmail &&
      !p.statusLabel?.toLowerCase().includes('devuelto') &&
      p.statusLabel !== 'Cancelado'
  )
  if (yaPrestado) return 'APROBADO'

  const solicitudes = leerJSON('solicitudes_prestamo', [])
  const pendiente = solicitudes.some(
    (s) => mismoLibro(s, book) && s.userEmail === userEmail && s.status === 'PENDIENTE'
  )
  return pendiente ? 'PENDIENTE' : 'DISPONIBLE'
}

function BookCard({ book, onEdit }) {
  const navigate = useNavigate()
  const [showDetail, setShowDetail] = useState(false)
  const [showDocenteModal, setShowDocenteModal] = useState(false)
  const [plazoDocente, setPlazoDocente] = useState('30 días')

  const sesion = leerSesion()
  const userRole = sesion?.rol || 'Estudiante'
  const userEmail = sesion?.correo || sesion?.email || 'estudiante@institucion.edu'
  const esBibliotecario = userRole === 'Bibliotecario'

  const [status, setStatus] = useState(() => calcularEstadoPrestamo(book, userEmail))

  const sincronizarEstado = useCallback(() => {
    setStatus(calcularEstadoPrestamo(book, userEmail))
  }, [book, userEmail])

  // El setState se ejecuta dentro del evento de storage, no al montar.
  useEffect(() => {
    window.addEventListener('storage', sincronizarEstado)
    return () => window.removeEventListener('storage', sincronizarEstado)
  }, [sincronizarEstado])

  const registrarSolicitud = (plazoAsignado) => {
    const solicitudes = leerJSON('solicitudes_prestamo', [])
    const nuevaSolicitud = {
      id: generarId('sol'),
      bookId: book.id,
      title: book.title,
      author: book.author,
      signature: book.signature || book.signatura || 'BIB-S/N',
      image: book.image,
      userEmail,
      userRole,
      plazo: plazoAsignado,
      date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDIENTE',
    }

    if (escribirJSON('solicitudes_prestamo', [nuevaSolicitud, ...solicitudes])) {
      setStatus('PENDIENTE')
      setShowDocenteModal(false)
      notificarCambioStorage()
    }
  }

  const handleRequestClick = () => {
    if (userRole === 'Docente') {
      setShowDocenteModal(true)
    } else {
      registrarSolicitud('8 días (Estándar)')
    }
  }

  const handleRead = () => {
    navigate('/lectura', {
      state: {
        bookTitle: book.title,
        author: book.author,
        signature: book.signature || book.signatura || 'BIB-001',
        image: book.image,
      },
    })
  }

  return (
    <>
      <article className="group flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-outline-variant/20 relative">
        <div className="relative h-64 w-full overflow-hidden bg-surface-container">
          <img
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            src={book.image}
            alt={`Portada de ${book.title}`}
          />

          <div className="absolute top-space-sm left-space-sm flex flex-col gap-1 items-start">
            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-medium">
              {book.tag || book.genre || 'General'}
            </span>
          </div>

          {/* Botón de edición para Bibliotecario */}
          {esBibliotecario && onEdit && (
            <button
              onClick={() => onEdit(book)}
              title="Editar información del libro"
              className="absolute top-space-sm right-space-sm w-8 h-8 rounded-full bg-surface-container-lowest/95 backdrop-blur text-on-surface hover:text-secondary shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer z-10"
              type="button"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          )}

          <div className="absolute bottom-space-sm left-space-sm right-space-sm flex justify-between items-end">
            <span
              className={`px-2.5 py-1 rounded font-semibold text-[11px] ${
                status === 'APROBADO'
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                  : status === 'PENDIENTE'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : toneClasses[book.availabilityTone] || toneClasses.positive
              }`}
            >
              {status === 'APROBADO'
                ? 'Préstamo Aprobado'
                : status === 'PENDIENTE'
                ? 'En Revisión (Bibliotecario)'
                : book.availability || 'Disponible'}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-lowest/95 backdrop-blur font-mono text-[10px] text-on-surface-variant font-medium">
              {book.format || 'Digital'}
            </span>
          </div>
        </div>

        <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-mono tracking-tight text-on-surface-variant">
                {book.signature || book.signatura || 'BIB-S/N'}
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
                className="w-full py-1.5 px-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg transition-colors text-center cursor-pointer"
                type="button"
              >
                Ver ficha
              </button>
              {esBibliotecario && onEdit && (
                <button
                  onClick={() => onEdit(book)}
                  title="Editar libro"
                  className="py-1.5 px-2.5 bg-surface-container-low hover:bg-surface-container text-secondary rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              )}
            </div>

            {/* CONTROL DIFERENCIADO POR ROL */}
            {esBibliotecario ? (
              <button
                onClick={handleRead}
                className="w-full py-2 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-secondary">visibility</span>
                <span>Inspeccionar lectura</span>
              </button>
            ) : status === 'APROBADO' ? (
              <button
                onClick={handleRead}
                className="w-full py-2 px-space-sm bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">auto_stories</span>
                <span>Leer ahora</span>
              </button>
            ) : status === 'PENDIENTE' ? (
              <button
                disabled
                className="w-full py-2 px-space-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                type="button"
              >
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                <span>Solicitud en revisión</span>
              </button>
            ) : (
              <button
                onClick={handleRequestClick}
                className="w-full py-2 px-space-sm bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">bookmark_add</span>
                <span>{userRole === 'Docente' ? 'Solicitar (Beneficio Docente)' : 'Solicitar préstamo'}</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Modal para Docente */}
      {showDocenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-secondary">school</span>
              <div>
                <h3 className="font-title-md text-on-surface font-bold">Beneficio de Préstamo Docente</h3>
                <p className="font-body-sm text-on-surface-variant text-xs">Selecciona el plazo extendido para tu labor académica</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-2">
              <label className="text-xs font-semibold text-on-surface">Plazo requerido:</label>
              <select
                value={plazoDocente}
                onChange={(e) => setPlazoDocente(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/40 focus:outline-none cursor-pointer"
              >
                <option value="15 días">15 días de consulta</option>
                <option value="30 días">30 días (1 mes estándar)</option>
                <option value="60 días">60 días (2 meses periodo formativo)</option>
                <option value="Semestre Académico Completo">Semestre Académico Completo (16 semanas)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDocenteModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => registrarSolicitud(plazoDocente)}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold cursor-pointer"
              >
                Confirmar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Bibliográfica */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <img className="w-20 h-28 object-cover rounded shadow" src={book.image} alt={book.title} />
                <div className="flex flex-col">
                  <h3 className="font-title-lg text-on-surface font-bold leading-tight font-serif">{book.title}</h3>
                  <p className="font-body-md text-on-surface-variant">{book.author}</p>
                  <span className="font-mono text-xs text-secondary mt-1">Signatura: {book.signature || book.signatura || 'BIB-001'}</span>
                  <span className="text-xs text-on-surface-variant">ISBN: {book.isbn || '978-958-888-01'}</span>
                  <span className="text-xs text-on-surface-variant">Género: {book.tag || book.genre || 'Literatura'}</span>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              Obra perteneciente al acervo bibliotecario de la institución. Incluye acceso a herramientas de comprensión exegética y lectura activa de textos curriculares.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md cursor-pointer"
              >
                Cerrar
              </button>
              {esBibliotecario && onEdit && (
                <button
                  onClick={() => {
                    setShowDetail(false)
                    onEdit(book)
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Editar obra</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookCard