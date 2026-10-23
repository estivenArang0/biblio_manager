import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogBooks as initialBooks } from '../data/catalogBooks'
import { generarId } from '../utils/text'
import { researchLines } from '../data/recommendations'

function Recomendaciones() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario_biblio') || '{}')
    } catch {
      return {}
    }
  })

  const esBibliotecario = usuario.rol === 'Bibliotecario'
  const userEmail = usuario.correo || usuario.email || 'estudiante@tdea.edu.co'

  // Redirección de seguridad: el bibliotecario no tiene acceso a la vista de recomendaciones de lectura
  useEffect(() => {
    if (esBibliotecario) {
      navigate('/catalogo', { replace: true })
    }
  }, [esBibliotecario, navigate])

  const [catalogBooks] = useState(() => {
    try {
      const guardados = localStorage.getItem('catalogo_libros_agregados')
      return guardados ? JSON.parse(guardados) : initialBooks
    } catch {
      return initialBooks
    }
  })

  const dynamicIntents = useMemo(() => {
    const genresSet = new Set()
    catalogBooks.forEach((b) => {
      const g = (b.tag || b.genre || '').trim()
      if (g) genresSet.add(g)
    })
    return ['Todas las intenciones', ...Array.from(genresSet).sort()]
  }, [catalogBooks])

  const [activeIntent, setActiveIntent] = useState('Todas las intenciones')
  const [currentReading, setCurrentReading] = useState(null)

  // Cargar lectura activa EXCLUSIVA del usuario actual (solo Estudiantes y Docentes)
  useEffect(() => {
    if (esBibliotecario) return

    const verificarLecturaActiva = () => {
      try {
        const sesionActual = JSON.parse(localStorage.getItem('usuario_biblio') || '{}')
        const emailActual = sesionActual.correo || sesionActual.email || userEmail
        setUsuario(sesionActual)

        const prestamos = JSON.parse(localStorage.getItem('prestamos_biblio') || '[]')
        
        // FILTRADO ESTRICTO: pertenecer a este usuario y NO estar devuelto/cancelado
        const activo = prestamos.find((p) => {
          const esMio = p.userEmail === emailActual
          const estaActivo =
            !p.statusLabel?.toLowerCase().includes('devuelto') &&
            p.statusLabel !== 'Cancelado' &&
            !p.statusLabel?.includes('pts') // Excluir folios de trivia
          return esMio && estaActivo
        })

        if (activo) {
          setCurrentReading({
            title: activo.title,
            author: activo.author,
            signature: activo.meta || activo.signature || 'BIB-S/N',
            chapter: activo.category === 'academic' ? 'Folio Exegético Activo' : 'Lectura en Curso',
            image:
              activo.image ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
          })
        } else {
          setCurrentReading(null)
        }
      } catch (e) {
        console.error(e)
        setCurrentReading(null)
      }
    }

    verificarLecturaActiva()
    window.addEventListener('storage', verificarLecturaActiva)
    return () => window.removeEventListener('storage', verificarLecturaActiva)
  }, [esBibliotecario, userEmail])

  const handleContinueReading = () => {
    if (!currentReading) return
    navigate('/lectura', {
      state: {
        bookTitle: currentReading.title,
        author: currentReading.author,
        signature: currentReading.signature,
        image: currentReading.image,
      },
    })
  }

  const handleReserve = (book) => {
    const stored = JSON.parse(localStorage.getItem('solicitudes_prestamo') || '[]')
    const nuevaSolicitud = {
      id: generarId('sol'),
      bookId: book.id || generarId('libro'),
      title: book.title,
      author: book.author,
      userEmail: usuario.correo || usuario.email || 'estudiante@tdea.edu.co',
      userRole: usuario.rol || 'Estudiante',
      plazo: usuario.rol === 'Docente' ? '30 días (Docente)' : '8 días (Estándar)',
      status: 'PENDIENTE',
      date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      image: book.image,
      signature: book.signature || book.signatura || 'REC-SUG-01',
    }

    localStorage.setItem('solicitudes_prestamo', JSON.stringify([nuevaSolicitud, ...stored]))
    window.dispatchEvent(new Event('storage'))
    alert(`¡Solicitud enviada! "${book.title}" ha sido enviado a la bandeja de aprobación del Bibliotecario.`)
    navigate('/catalogo')
  }

  const filteredRecommendations = useMemo(() => {
    if (activeIntent === 'Todas las intenciones') return catalogBooks

    return catalogBooks.filter((book) => {
      const g = (book.tag || book.genre || '').toLowerCase()
      return g.includes(activeIntent.toLowerCase())
    })
  }, [catalogBooks, activeIntent])

  if (esBibliotecario) return null

  return (
    <div className="px-gutter py-space-lg flex flex-col gap-space-xl max-w-7xl mx-auto w-full select-none">
      {/* Banner principal */}
      <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-md">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary-container opacity-10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 p-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 text-on-primary-container font-label-sm text-label-sm mb-space-sm backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm text-secondary-container">psychology</span>
                <span>Motor de Recuperación Semántica v4.2</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-primary tracking-tight font-serif">
                Descubre tu próxima gran lectura
              </h1>
              <p className="font-body-md text-body-md text-surface-container-highest mt-space-xs leading-relaxed">
                Sugerencias generadas por análisis semántico de temas, autores afines y consultas en el acervo
                institucional registrado.
              </p>
            </div>
            <div className="flex items-center gap-space-xs text-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>Ajustado al perfil de lectura académica</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <span className="font-label-sm text-label-sm text-surface-container-highest tracking-wide uppercase">
              Intención y enfoque conceptual (Registrados en Acervo)
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {dynamicIntents.map((chip) => {
                const isActive = chip === activeIntent
                return (
                  <button
                    key={chip}
                    onClick={() => setActiveIntent(chip)}
                    className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                        : 'bg-surface-container-lowest/10 text-on-primary hover:bg-surface-container-lowest/20'
                    }`}
                    type="button"
                  >
                    {isActive && <span className="material-symbols-outlined text-sm">check</span>}
                    <span>{chip}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lectura en curso (Solo para Estudiante / Docente con préstamo activo) */}
      {currentReading ? (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg border border-outline-variant/20">
          <div className="flex items-start sm:items-center gap-space-md w-full md:w-auto">
            <div className="w-16 h-24 rounded-lg bg-surface-container-low shrink-0 overflow-hidden shadow-sm relative">
              <img
                className="w-full h-full object-cover"
                alt={`Portada de ${currentReading.title}`}
                src={currentReading.image}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-sm text-label-sm text-secondary font-medium uppercase tracking-wider">
                  Lectura en curso actualmente
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  Signatura: {currentReading.signature}
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-serif font-bold">
                {currentReading.title}
              </h2>
              <span className="font-body-md text-body-md text-on-surface-variant">{currentReading.author}</span>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md mt-2 font-label-sm text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-on-surface">bookmark</span>
                  {currentReading.chapter}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-on-surface">schedule</span>
                  Préstamo activo en sesión ({userEmail})
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={handleContinueReading}
              className="px-space-md py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm transition-colors flex items-center gap-2 active:scale-[0.98] cursor-pointer"
              type="button"
            >
              <span>Continuar leyendo</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs flex items-center justify-between border border-outline-variant/20">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-2xl">book</span>
            <div className="text-xs">
              <span className="font-semibold text-on-surface block">Sin préstamos en lectura activa</span>
              Todos los ejemplares consultados han sido devueltos a sala o no tienes solicitudes aprobadas.
            </div>
          </div>
          <button
            onClick={() => navigate('/catalogo')}
            className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium transition-colors cursor-pointer"
          >
            Explorar catálogo
          </button>
        </div>
      )}

      {/* Grilla de recomendaciones */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-secondary font-medium tracking-wider uppercase">
              Selección Algorítmica en Acervo
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-serif">
              Recomendaciones para "{activeIntent}"
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
            {filteredRecommendations.length} obras coincidentes
          </span>
        </div>

        {filteredRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {filteredRecommendations.map((book, idx) => {
              const afinidades = ['98% afinidad', '96% afinidad', '94% afinidad', '91% afinidad', '89% afinidad']
              const afinidadTag = afinidades[idx % afinidades.length]

              return (
                <div
                  key={book.id || book.title}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow border border-outline-variant/20"
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
                      <img className="w-full h-full object-cover" src={book.image} alt={`Portada de ${book.title}`} />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary text-on-primary shadow-sm font-medium">
                        {afinidadTag}
                      </span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{book.author}</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mt-0.5 leading-snug font-serif font-bold">
                        {book.title}
                      </h3>
                      <div className="mt-space-xs p-space-xs rounded bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                        Materia: <strong className="text-on-surface">{book.tag || book.genre || 'Literatura'}</strong>. 
                        Signatura curricular {book.signature || book.signatura || 'BIB-S/N'}.
                      </div>
                    </div>
                  </div>
                  <div className="pt-space-md mt-auto">
                    <button
                      onClick={() => handleReserve(book)}
                      className="w-full py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_add</span>
                      <span>Solicitar / Reservar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center bg-surface-container-low rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">menu_book</span>
            <p className="font-headline-sm font-semibold text-on-surface">No hay obras registradas bajo esta intención temática.</p>
            <p className="font-body-sm mt-1">Registra un nuevo libro desde el Catálogo o selecciona otra intención.</p>
          </div>
        )}
      </div>

      {/* Líneas de investigación */}
      <div className="flex flex-col gap-space-md pb-space-lg">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Caminos metodológicos
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Líneas de investigación sugeridas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {researchLines.map((line) => (
            <div
              key={line.title}
              className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between border border-outline-variant/20"
            >
              <div className="flex flex-col gap-space-xs">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary mb-1">
                  <span className="material-symbols-outlined text-title-lg">{line.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif font-bold">{line.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  {line.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-space-sm">
                  {line.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/catalogo')}
                className="mt-space-md inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline self-start cursor-pointer"
                type="button"
              >
                <span>Explorar corpus temático</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Recomendaciones