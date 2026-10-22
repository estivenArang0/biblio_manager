import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const fontSizes = [16, 18, 20, 22]
const readingModes = {
  light: { bg: '#ffffff', color: '#191c1e', label: 'Claro', swatch: '#f7f9fb' },
  sepia: { bg: '#faedd9', color: '#2a1704', label: 'Sepia', swatch: '#faedd9' },
  night: { bg: '#111c2e', color: '#e2e8f0', label: 'Noche', swatch: '#1c2430' },
}

// Folios clásicos para Don Quijote
const quijotePages = [
  {
    folio: 142,
    chapter: 'PARTE PRIMERA • CAPÍTULO VIII',
    paragraphs: [
      `En esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo; y, así como don Quijote los vio, dijo a su escudero: —La ventura va guiando nuestras cosas mejor de lo que acertáramos a desear; porque ves allí, amigo Sancho Panza, donde se descubren treinta, o pocos más, desaforados gigantes, con quien pienso hacer batalla y quitarles a todos las vidas, con cuyos despojos comenzaremos a enriquecer; que ésta es buena guerra, y es gran servicio de Dios quitar tan mala simiente de sobre la faz de la tierra.`,
      `—¿Qué gigantes? —dijo Sancho Panza. —Aquellos que allí ves —respondió su amo—, de los brazos largos, que los suelen tener algunos de casi dos leguas. —Mire vuestra merced —respondió Sancho— que aquellos que allí se parecen no son gigantes, sino molinos de viento, y lo que en ellos parecen brazos son las aspas, que, volteadas del viento, hacen andar la piedra del molino.`,
      `—Bien parece —respondió don Quijote— que no estás cursado en esto de las aventuras: ellos son gigantes; y si tienes miedo, quítate de ahí, y ponte en oración en el espacio que yo voy a entrar con ellos en fiera y desigual batalla.`,
      `Y, diciendo esto, dio de espuelas a su caballo Rocinante, sin atender a las voces que su escudero Sancho le daba, advirtiéndole que, sin duda alguna, eran molinos de viento, y no gigantes, aquellos que iba a acometer.`,
    ],
    trivia: {
      question:
        '¿Cuál es la interpretación retórica y psicológica que Cervantes atribuye al contraste entre don Quijote y Sancho Panza ante la aparición de los molinos de viento?',
      correctOption: 'A',
      options: [
        {
          id: 'A',
          text: 'Una contraposición dialéctica entre el idealismo caballeresco absoluto y el pragmatismo empírico terrenal.',
          hint: 'Perspectiva humanista clásica',
        },
        {
          id: 'B',
          text: 'Una crítica paródica exclusiva a los molineros manchegos de la época.',
          hint: 'Lectura costumbrista literal',
        },
        {
          id: 'C',
          text: 'Una demostración de cobardía por parte del escudero frente a una amenaza bélica real.',
          hint: 'Lectura fáctica militar',
        },
      ],
      explanation:
        'En esta escena capital, Cervantes instaura la dualidad moderna: mientras Quijote proyecta su universo moral y simbólico sobre la realidad física materializándola en "desaforados gigantes", Sancho actúa como ancla perceptiva y sentido común popular.',
    },
  },
  {
    folio: 143,
    chapter: 'PARTE PRIMERA • CAPÍTULO VIII (CONTINUACIÓN)',
    paragraphs: [
      `Iba don Quijote tan puesto en que eran gigantes, que ni oía las voces de su escudero Sancho, ni echaba de ver, aunque estaba ya bien cerca, lo que eran; antes iba diciendo a grandes voces: —¡Non fuyades, cobardes y viles criaturas, que un solo caballero es el que os acomete!`,
      `Levantóse en esto un poco de viento, y las grandes aspas comenzaron a moverse, lo cual visto por don Quijote, dijo: —Pues aunque mováis más brazos que los del gigante Briareo, me lo habéis de pagar.`,
      `Y, diciendo esto, y encomendándose de todo corazón a su señora Dulcinea, pidiéndole que en tal trance le socorriese, bien cubierto de su rodela, con la lanza en el ristre, arremetió a todo el galope de Rocinante y embistió con el primer molino que estaba delante; y dándole una lanzada en el aspa, la volvió el viento con tanta furia, que hizo la lanza pedazos, llevándose tras sí al caballo y al caballero, que fue rodando muy maltrecho por el campo.`,
    ],
    trivia: {
      question:
        '¿A qué figura mitológica alude don Quijote al desafiar el movimiento de las aspas del molino?',
      correctOption: 'B',
      options: [
        {
          id: 'A',
          text: 'Al cíclope Polifemo que custodia las costas de Sicilia.',
          hint: 'Mitología homérica de la Odisea',
        },
        {
          id: 'B',
          text: 'Al gigante Briareo, monstruo de cien brazos y cincuenta cabezas.',
          hint: 'Mitología hesiódica clásica de la Titanomaquia',
        },
        {
          id: 'C',
          text: 'Al minotauro Asterión encerrado en el laberinto de Creta.',
          hint: 'Mitología clásica ateniense',
        },
      ],
      explanation:
        'Don Quijote invoca explícitamente a Briareo, el hecatónquiro mitológico que poseía cien brazos, justificando en su imaginario caballeresco el número desmesurado de miembros que parecían agitar los molinos.',
    },
  },
]

const quijoteGlossary = [
  {
    term: 'Desaforados gigantes',
    tag: 'adj. arcaico',
    def: 'Que actúan fuera de todo fuero, desmesurados o desmedidamente soberbios en talla y ley.',
  },
  {
    term: 'Aspas',
    tag: 'sust. femenino',
    def: 'Maderos cruzados en forma de aspa o equis sobre el eje del molino.',
  },
  {
    term: 'Briareo',
    tag: 'onomástica mítica',
    def: 'Titán o hecatónquiro de la mitología clásica, dotado de cien brazos y cincuenta cabezas.',
  },
]

function LecturaInteractiva() {
  const location = useLocation()
  const navigate = useNavigate()

  // 1. Obtener usuario de la sesión actual
  const usuario = JSON.parse(localStorage.getItem('usuario_biblio') || '{}')
  const userEmail = usuario.correo || usuario.email || 'estudiante@tdea.edu.co'

  const bookState = location.state || {}

  // 2. Obtener ÚNICAMENTE los préstamos activos pertenecientes a ESTE usuario
  const misPrestamosActivos = useMemo(() => {
    try {
      const todos = JSON.parse(localStorage.getItem('prestamos_biblio') || '[]')
      return todos.filter((p) => {
        const esMio = !p.userEmail || p.userEmail === userEmail
        const noDevuelto = !p.statusLabel?.toLowerCase().includes('devuelto')
        return esMio && noDevuelto
      })
    } catch {
      return []
    }
  }, [userEmail])

  // Determinar el libro que se intenta leer
  const currentBookTitle = bookState.bookTitle || misPrestamosActivos[0]?.title
  const currentBookAuthor = bookState.author || misPrestamosActivos[0]?.author
  const currentSignature = bookState.signature || misPrestamosActivos[0]?.meta || misPrestamosActivos[0]?.signature || 'LIT-GEN-001'

  // Verificar si este usuario tiene préstamo activo de ESTE libro específico
  const tienePrestamoVigente = useMemo(() => {
    if (!currentBookTitle) return false
    return misPrestamosActivos.some(
      (p) =>
        p.title?.toLowerCase().trim() === currentBookTitle.toLowerCase().trim() ||
        currentBookTitle.toLowerCase().includes(p.title?.toLowerCase().trim())
    )
  }, [misPrestamosActivos, currentBookTitle])

  // Generar folios y contenido según el libro seleccionado
  const { bookPages, glossary } = useMemo(() => {
    const esQuijote = currentBookTitle?.toLowerCase().includes('quijote')

    if (esQuijote) {
      return { bookPages: quijotePages, glossary: quijoteGlossary }
    }

    const customPages = [
      {
        folio: 1,
        chapter: `SECCIÓN PRELIMINAR • APERTURA DE TEXTO CRÍTICO`,
        paragraphs: [
          `El presente ejemplar digitalizado de "${currentBookTitle || 'Obra Académica'}", cuya autoría corresponde a ${currentBookAuthor || 'Autor TdeA'}, forma parte del acervo curricular protegido de la institución bajo signatura topográfica ${currentSignature}.`,
          `En las páginas iniciales de este volumen, la construcción narrativa y discursiva propone una inmersión directa en las problemáticas estilísticas y contextuales de la época de su composición, estableciendo un diálogo riguroso entre la tradición literaria precedente y las innovaciones formales del autor.`,
          `A través de la lectura analítica de este primer folio, se invita al lector a examinar con detenimiento los recursos retóricos, la estructura de los enunciados y la intencionalidad estética subyacente que posicionan a "${currentBookTitle}" como una obra fundamental para los estudios contemporáneos.`,
        ],
        trivia: {
          question: `¿Cuál es el propósito hermenéutico principal del enfoque analítico propuesto para la obra "${currentBookTitle}"?`,
          correctOption: 'A',
          options: [
            {
              id: 'A',
              text: 'Desentrañar las tensiones formales, retóricas y contextuales inherentes a la propuesta estética del autor.',
              hint: 'Análisis textual crítico e interdisciplinar',
            },
            {
              id: 'B',
              text: 'Reducir la obra a un mero ejercicio de memorización cronológica sin interpretación crítica.',
              hint: 'Lectura memorística pasiva',
            },
            {
              id: 'C',
              text: 'Descartar la relevancia de los recursos estilísticos para atender únicamente a la trama superficial.',
              hint: 'Lectura pragmática descontextualizada',
            },
          ],
          explanation: `El estudio crítico de "${currentBookTitle}" exige articular la forma literaria con su horizonte histórico y conceptual.`,
        },
      },
      {
        folio: 2,
        chapter: `DESARROLLO EXEGÉTICO • LECTURA AVANZADA`,
        paragraphs: [
          `Avanzando en la lectura de "${currentBookTitle}", los núcleos temáticos se profundizan, revelando una compleja red de significados simbólicos y relaciones intertextuales que dialogan con el canon académico universal.`,
          `El autor articula una voz particular donde las decisiones de perspectiva, el ritmo de la prosa y la selección léxica configuran una experiencia estética integral.`,
        ],
        trivia: {
          question: `¿Cómo contribuye la articulación de la voz y el ritmo expresivo en "${currentBookTitle}" al desarrollo de su propuesta temática?`,
          correctOption: 'B',
          options: [
            {
              id: 'A',
              text: 'Generando una estructura uniforme que evade el diálogo con otras obras de la disciplina.',
              hint: 'Enfoque estático y aislado',
            },
            {
              id: 'B',
              text: 'Consolidando una estética integral que interpela al lector crítico mediante relaciones intertextuales y recursos de estilo.',
              hint: 'Postura dialógica formativa',
            },
            {
              id: 'C',
              text: 'Subordinando el contenido a fórmulas retóricas convencionales sin aporte reflexivo.',
              hint: 'Enfoque mecánico desprovisto de fondo',
            },
          ],
          explanation: `La maestría del autor radica en entrelazar la cadencia discursiva con un rigor temático que potencia la exégesis de la obra.`,
        },
      },
    ]

    const customGlossary = [
      {
        term: 'Exégesis',
        tag: 'sust. femenino',
        def: 'Interpretación crítica, sistemática y contextual de un texto literario o documental.',
      },
      {
        term: 'Intertextualidad',
        tag: 'sust. femenino',
        def: 'Relación de diálogo, alusión o resonancia que un texto establece con otras creaciones del canon.',
      },
      {
        term: 'Hermenéutica',
        tag: 'teoría del arte',
        def: 'Metodología interpretativa orientada al esclarecimiento del sentido profundo y la intencionalidad estética.',
      },
    ]

    return { bookPages: customPages, glossary: customGlossary }
  }, [currentBookTitle, currentBookAuthor, currentSignature])

  const [pageIndex, setPageIndex] = useState(0)
  const [fontIndex, setFontIndex] = useState(1)
  const [mode, setMode] = useState('light')
  const [selectedOption, setSelectedOption] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)

  const [isScreenBlocked, setIsScreenBlocked] = useState(false)
  const [inactivityBlocked, setInactivityBlocked] = useState(false)
  const inactivityTimerRef = useRef(null)

  const currentPage = bookPages[pageIndex] || bookPages[0]
  const currentMode = readingModes[mode]

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      setInactivityBlocked(true)
    }, 120000)
  }

  useEffect(() => {
    resetInactivityTimer()

    const handleBlur = () => setIsScreenBlocked(true)
    const handleFocus = () => setIsScreenBlocked(false)
    const handleVisibility = () => {
      if (document.hidden) setIsScreenBlocked(true)
      else setIsScreenBlocked(false)
    }

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) setIsScreenBlocked(true)
    }
    const handleMouseEnter = () => setIsScreenBlocked(false)

    const handleKeyDown = (e) => {
      resetInactivityTimer()

      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setIsScreenBlocked(true)
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText('Contenido protegido por derechos de autor - BiblioManager TdeA')
            .catch(() => {})
        }
        setTimeout(() => setIsScreenBlocked(false), 2500)
      }

      if ((e.ctrlKey || e.metaKey) && ['c', 'u', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }

    const handleMouseMove = () => resetInactivityTimer()

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleNextPage = () => {
    if (pageIndex < bookPages.length - 1) {
      setPageIndex((prev) => prev + 1)
      setSelectedOption(null)
      setShowFeedback(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      alert(`¡Lectura completada! Has finalizado el fragmento de "${currentBookTitle}" con ${score} pts acumulados.`)
      navigate('/historial')
    }
  }

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1)
      setSelectedOption(null)
      setShowFeedback(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleValidate = () => {
    if (!selectedOption) return
    const correct = selectedOption === currentPage.trivia.correctOption
    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      setScore((prev) => prev + 100)
      const prestamos = JSON.parse(localStorage.getItem('prestamos_biblio') || '[]')
      const eventoExegesis = {
        id: Date.now().toString(),
        title: `${currentBookTitle} · Folio ${currentPage.folio}`,
        author: currentBookAuthor,
        date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        statusLabel: '+100 pts Exégesis',
        statusClass: 'bg-primary text-on-primary',
        meta: `Folio ${currentPage.folio} Aprobado`,
        meta2: 'Comprensión Lectora Activa',
        image:
          bookState.image ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        category: 'academic',
        actions: ['Revisar notas'],
        userEmail: userEmail, // <-- Vinculado estrictamente al usuario que resolvió la trivia
      }
      localStorage.setItem('prestamos_biblio', JSON.stringify([eventoExegesis, ...prestamos]))
    }
  }

  // SI EL LIBRO FUE DEVUELTO O NO EXISTE PRÉSTAMO ACTIVO PARA ESTE USUARIO
  if (!tienePrestamoVigente) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-surface-container-lowest max-w-lg w-full p-8 rounded-2xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">auto_stories</span>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-headline-sm text-headline-sm font-serif font-bold text-on-surface">
              Sin Préstamo Activo
            </h2>
            <p className="text-body-sm text-on-surface-variant max-w-sm mt-1">
              {currentBookTitle
                ? `El ejemplar "${currentBookTitle}" fue devuelto a sala o no tienes un préstamo vigente asociado a tu cuenta (${userEmail}).`
                : `No tienes préstamos activos vigentes en este momento.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              onClick={() => navigate('/catalogo')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer"
              type="button"
            >
              Ir al Catálogo de Libros
            </button>
            <button
              onClick={() => navigate('/historial')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all cursor-pointer"
              type="button"
            >
              Ver mi Historial
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col w-full relative min-h-screen select-none"
    >
      {/* TELÓN DE PROTECCIÓN */}
      {isScreenBlocked && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white">
          <span className="material-symbols-outlined text-6xl text-amber-400 mb-3 animate-pulse">
            security
          </span>
          <h2 className="text-2xl font-bold mb-2 font-serif">Visualización Pausada por Seguridad Académica</h2>
          <p className="text-sm text-gray-300 max-w-md">
            El contenido de este ejemplar está protegido por la Ley de Propiedad Intelectual. Regresa a esta ventana para reanudar la lectura.
          </p>
        </div>
      )}

      {/* BLOQUEO POR INACTIVIDAD */}
      {inactivityBlocked && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest p-6 rounded-xl max-w-sm w-full text-center flex flex-col items-center gap-3 shadow-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl text-secondary">timer_off</span>
            <h3 className="font-title-lg font-bold text-on-surface font-serif">Sesión en Pausa</h3>
            <p className="text-body-sm text-on-surface-variant">
              Se suspendió la sesión de lectura por inactividad.
            </p>
            <button
              onClick={() => {
                setInactivityBlocked(false)
                resetInactivityTimer()
              }}
              className="w-full mt-2 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow-sm cursor-pointer"
            >
              Reanudar Lectura
            </button>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR */}
      <header className="sticky top-16 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
        <div className="max-w-[1720px] mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <span className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-title-lg">menu_book</span>
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold font-serif">
                  {currentBookTitle}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-xs font-medium whitespace-nowrap">
                  Edición Digital
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate">
                <span>{currentBookAuthor}</span>
                <span>•</span>
                <span className="font-mono text-secondary">Signatura: {currentSignature}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary font-label-md text-xs font-semibold">
            <span className="material-symbols-outlined text-lg">emoji_events</span>
            <span>Puntos de Comprensión: {score} pts</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-outline-variant/20">
              <button
                className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface font-bold text-xs cursor-pointer"
                onClick={() => setFontIndex((i) => Math.max(0, i - 1))}
              >
                A-
              </button>
              <span className="px-2 text-xs font-semibold text-on-surface">{fontSizes[fontIndex]}px</span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface font-bold text-xs cursor-pointer"
                onClick={() => setFontIndex((i) => Math.min(fontSizes.length - 1, i + 1))}
              >
                A+
              </button>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg p-1 gap-1 border border-outline-variant/20">
              {Object.entries(readingModes).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    mode === key
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.swatch }}></span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full bg-surface-container h-1 relative overflow-hidden">
          <div
            className="bg-secondary h-full transition-all duration-300"
            style={{ width: `${((pageIndex + 1) / bookPages.length) * 100}%` }}
          ></div>
        </div>
        <div className="max-w-[1720px] mx-auto px-6 py-1 flex items-center justify-between text-on-surface-variant text-[11px] bg-surface-container-low/40">
          <span>Folio {currentPage.folio} • Sección {pageIndex + 1} de {bookPages.length}</span>
          <span className="font-semibold">{Math.round(((pageIndex + 1) / bookPages.length) * 100)}% de avance</span>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO */}
      <div className="max-w-[1720px] mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-7 flex flex-col gap-6 relative">
            <article
              className="relative rounded-xl p-8 md:p-12 shadow-sm transition-colors duration-300 overflow-hidden border border-outline-variant/20"
              style={{ backgroundColor: currentMode.bg, color: currentMode.color }}
            >
              {/* Marca de agua forense con trazabilidad de usuario */}
              <div className="absolute inset-0 pointer-events-none select-none opacity-[0.04] flex flex-wrap items-center justify-around p-4 rotate-[-15deg] z-10 text-xs font-mono font-bold uppercase">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="m-6">{userEmail} · TdeA · NO COPIAR</span>
                ))}
              </div>

              <div className="flex items-center justify-between pb-6 mb-6 text-on-surface-variant text-xs tracking-widest uppercase border-b border-outline-variant/15">
                <span className="font-medium">{currentPage.chapter}</span>
                <span className="font-bold text-secondary">FOLIO {currentPage.folio}</span>
              </div>

              <div
                className="leading-relaxed text-justify space-y-5 font-serif"
                style={{ fontSize: `${fontSizes[fontIndex]}px`, lineHeight: `${fontSizes[fontIndex] * 1.7}px` }}
              >
                {currentPage.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* CONTROLES DE CAMBIO DE PÁGINA */}
              <footer className="mt-10 pt-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  disabled={pageIndex === 0}
                  onClick={handlePrevPage}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    pageIndex === 0
                      ? 'bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Página anterior</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span>Página</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-bold text-on-surface">
                    {currentPage.folio}
                  </span>
                  <span>de {bookPages.length}</span>
                </div>

                <button
                  onClick={handleNextPage}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm transition-all cursor-pointer"
                  type="button"
                >
                  <span>{pageIndex < bookPages.length - 1 ? 'Siguiente página' : 'Finalizar lectura'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </footer>
            </article>
          </section>

          {/* PANEL DE TRIVIAS Y GLOSARIO */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-5 border border-outline-variant/20">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">psychology</span>
                  <h2 className="font-title-md font-bold text-on-surface font-serif">Comprensión Curricular</h2>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                  Folio {currentPage.folio}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                  Trivia Express
                </span>
                <p className="text-xs font-semibold text-on-surface leading-snug">
                  {currentPage.trivia.question}
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  {currentPage.trivia.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-3 rounded-lg cursor-pointer text-xs transition-all border ${
                        selectedOption === opt.id
                          ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
                          : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`trivia-${currentPage.folio}`}
                        checked={selectedOption === opt.id}
                        onChange={() => {
                          setSelectedOption(opt.id)
                          setShowFeedback(false)
                        }}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">[{opt.id}] {opt.text}</span>
                        <span className="text-[10px] text-on-surface-variant/80 mt-0.5">{opt.hint}</span>
                      </div>
                    </label>
                  ))}

                  <button
                    disabled={!selectedOption}
                    onClick={handleValidate}
                    className="mt-1 w-full py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    type="button"
                  >
                    Validar respuesta
                  </button>
                </div>

                {showFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs leading-relaxed mt-1 ${
                      isCorrect
                        ? 'bg-green-100 text-green-950 border border-green-300'
                        : 'bg-red-100 text-red-950 border border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <span className="material-symbols-outlined text-sm">
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <span>{isCorrect ? '¡Correcto! (+100 pts)' : 'Respuesta errónea'}</span>
                    </div>
                    <p className="text-[11px] opacity-90">{currentPage.trivia.explanation}</p>
                  </div>
                )}
              </div>

              {/* GLOSARIO */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-bold text-on-surface">Vocabulario Filológico</span>
                <div className="space-y-2">
                  {glossary.map((g) => (
                    <div key={g.term} className="p-2.5 rounded-lg bg-surface-container-low text-xs flex flex-col gap-0.5 border border-outline-variant/10">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-secondary">{g.term}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono">{g.tag}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">{g.def}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default LecturaInteractiva