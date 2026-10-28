import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

const fontSizes = [16, 18, 20, 22]
const readingModes = {
  light: { bg: '#ffffff', color: '#191c1e', label: 'Claro', swatch: '#f7f9fb' },
  sepia: { bg: '#faedd9', color: '#2a1704', label: 'Sepia', swatch: '#faedd9' },
  night: { bg: '#111c2e', color: '#e2e8f0', label: 'Noche', swatch: '#1c2430' },
}
const colores = [
  { key: 'amarillo', label: 'Amarillo', swatch: '#facc15' },
  { key: 'verde', label: 'Verde', swatch: '#22c55e' },
  { key: 'azul', label: 'Azul', swatch: '#3b82f6' },
]

function Lector() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(null)
  const [index, setIndex] = useState(() => {
    const page = Number(searchParams.get('page'))
    return Number.isInteger(page) && page >= 0 ? page : 0
  })
  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const [blocked, setBlocked] = useState(null)
  const [toast, setToast] = useState('')

  const [selection, setSelection] = useState(null)
  const [noteMode, setNoteMode] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteColor, setNoteColor] = useState('amarillo')
  const [editing, setEditing] = useState(null)
  const [editColor, setEditColor] = useState('amarillo')
  const [editNote, setEditNote] = useState('')
  const [editFavorite, setEditFavorite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [marksOpen, setMarksOpen] = useState(false)
  const [flashId, setFlashId] = useState(null)

  const [fontIndex, setFontIndex] = useState(1)
  const [mode, setMode] = useState('light')
  const [selectedOption, setSelectedOption] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [reflectionDone, setReflectionDone] = useState(false)
  const [activities, setActivities] = useState({})
  const [activityTotals, setActivityTotals] = useState({ answered: 0, correct: 0, totalTrivias: 0 })
  const [savingActivity, setSavingActivity] = useState(false)

  const articleRef = useRef(null)
  const openedRef = useRef(false)
  const selectionTimer = useRef(null)
  const selectionRef = useRef(null)
  const activitiesRef = useRef({})
  const totalsRef = useRef({ answered: 0, correct: 0, totalTrivias: 0 })

  const registrarCierre = useCallback(() => {
    if (!openedRef.current) return
    openedRef.current = false
    api.readingSession(bookId, 'close').catch(() => {})
  }, [bookId])

  // Carga inicial: metadatos, subrayados y registro de apertura.
  useEffect(() => {
    let alive = true
    async function iniciar() {
      try {
        const data = await api.readingBook(bookId)
        if (!alive) return
        setMeta(data)
        if (data.total > 0) setIndex((current) => Math.min(current, data.total - 1))
        const [guardados, actividades] = await Promise.all([
          api.highlights(bookId).catch(() => ({ highlights: [] })),
          api
            .bookActivities(bookId)
            .catch(() => ({ activities: [], totals: { answered: 0, correct: 0, totalTrivias: 0 } })),
        ])
        if (!alive) return
        setHighlights(guardados.highlights || [])
        const mapa = Object.fromEntries(
          (actividades.activities || []).map((activity) => [activity.page, activity])
        )
        setActivities(mapa)
        activitiesRef.current = mapa
        setActivityTotals(actividades.totals || { answered: 0, correct: 0, totalTrivias: 0 })
        totalsRef.current = actividades.totals || { answered: 0, correct: 0, totalTrivias: 0 }
        openedRef.current = true
        api.readingSession(bookId, 'open').catch(() => {})
      } catch (err) {
        if (alive) setBlocked({ status: err.status, message: err.message })
      } finally {
        if (alive) setLoading(false)
      }
    }
    iniciar()
    return () => {
      alive = false
      registrarCierre()
    }
  }, [bookId, registrarCierre])

  // Cada página se valida contra el backend: si el préstamo venció o fue
  // devuelto, el propio servidor responde 403 y cerramos la lectura.
  useEffect(() => {
    if (!meta || blocked || meta.total === 0) return undefined
    let alive = true
    api
      .readingPage(bookId, index)
      .then((data) => {
        if (!alive) return
        setPage(data)
        const guardada = activitiesRef.current[index]
        setSelectedOption(guardada?.activityType === 'trivia' ? guardada.answer : null)
        setShowFeedback(Boolean(guardada?.activityType === 'trivia'))
        setIsCorrect(Boolean(guardada?.isCorrect))
        setReflectionText(guardada?.activityType === 'reflection' ? guardada.answer : '')
        setReflectionDone(guardada?.activityType === 'reflection')
        api.saveReadingProgress(bookId, index).catch(() => {})
        selectionRef.current = null
        setSelection(null)
        setNoteMode(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch((err) => {
        if (!alive) return
        if (err.status === 403) {
          registrarCierre()
          setBlocked({ status: 403, message: err.message })
        } else if (err.status === 401) {
          setBlocked({ status: 401, message: err.message })
        } else {
          setToast(err.message || 'No se pudo cargar la página.')
        }
      })
      .finally(() => {
        if (alive) setPageLoading(false)
      })
    return () => {
      alive = false
    }
  }, [bookId, index, meta, blocked, registrarCierre])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const cerrarAntesDeSalir = (event) => {
      if (!openedRef.current) return
      openedRef.current = false
      const request = api.readingSession(bookId, 'close').catch(() => {})
      event.detail?.waitUntil?.(request)
    }
    window.addEventListener('biblio:before-logout', cerrarAntesDeSalir)
    return () => window.removeEventListener('biblio:before-logout', cerrarAntesDeSalir)
  }, [bookId])

  // Bloqueo de copia, impresión y guardado dentro del visor.
  useEffect(() => {
    const bloquearAtajos = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (!['c', 's', 'p', 'x', 'u'].includes(key)) return
      const target = event.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      event.preventDefault()
      if (key === 'c' || key === 'x') setToast('Copiar está deshabilitado en el visor protegido.')
      if (key === 'p' || key === 's') setToast('Imprimir o guardar está deshabilitado.')
    }
    window.addEventListener('keydown', bloquearAtajos)
    return () => window.removeEventListener('keydown', bloquearAtajos)
  }, [])

  const bloquear = (event, mensaje) => {
    event.preventDefault()
    event.stopPropagation()
    setToast(mensaje)
  }

  const capturarSeleccion = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null)
      return
    }
    const range = sel.getRangeAt(0)
    const article = articleRef.current
    if (!article || !article.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }
    const startNode =
      range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer
    const blockEl = startNode?.closest?.('[data-block-index]')
    if (!blockEl || !article.contains(blockEl) || !blockEl.contains(range.endContainer)) {
      setSelection(null)
      return
    }
    const pre = range.cloneRange()
    pre.selectNodeContents(blockEl)
    try {
      pre.setEnd(range.startContainer, range.startOffset)
    } catch {
      setSelection(null)
      return
    }
    const start = pre.toString().length
    const text = range.toString()
    if (!text.trim()) {
      setSelection(null)
      return
    }
    const blockIndex = Number(blockEl.dataset.blockIndex)
    const end = start + text.length
    const overlapping = highlights.find(
      (item) =>
        item.page === index &&
        item.blockIndex === blockIndex &&
        item.startOffset < end &&
        item.endOffset > start
    )
    const siguiente = {
      blockIndex,
      start,
      end,
      text,
      highlightId: overlapping ? overlapping.id : null,
    }
    selectionRef.current = siguiente
    setSelection(siguiente)
    setNoteMode(false)
    setNoteDraft('')
  }, [highlights, index])

  // La selección se sigue también por evento: ratón, teclado y asas táctiles.
  useEffect(() => {
    const manejar = () => {
      if (selectionTimer.current) clearTimeout(selectionTimer.current)
      selectionTimer.current = setTimeout(() => {
        if (noteMode) return
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed) capturarSeleccion()
        else setSelection(null)
      }, 200)
    }
    document.addEventListener('selectionchange', manejar)
    return () => {
      document.removeEventListener('selectionchange', manejar)
      if (selectionTimer.current) clearTimeout(selectionTimer.current)
    }
  }, [capturarSeleccion, noteMode])

  const mantenerSeleccion = (event) => {
    // Evita que el clic en la barra colapse la selección; no cancelamos touchstart
    // para que el navegador móvil siga emitiendo el evento clic.
    if (event.type === 'touchstart') return
    event.preventDefault()
  }

  const quitarSeleccionada = async () => {
    const activa = selectionRef.current || selection
    if (!activa?.highlightId) return
    setSaving(true)
    try {
      await api.deleteHighlight(activa.highlightId)
      setHighlights((prev) => prev.filter((item) => item.id !== activa.highlightId))
      selectionRef.current = null
      setSelection(null)
      window.getSelection()?.removeAllRanges()
      setToast('Marca eliminada.')
    } catch (err) {
      setToast(err.message || 'No se pudo quitar la marca.')
    } finally {
      setSaving(false)
    }
  }

  const crearResaltado = async (color, note = '', isFavorite = false, mensaje = '') => {
    const activa = selectionRef.current || selection
    if (!activa) return
    setSaving(true)
    try {
      const data = await api.createHighlight({
        bookId,
        page: index,
        blockIndex: activa.blockIndex,
        startOffset: activa.start,
        endOffset: activa.end,
        text: activa.text,
        color,
        note,
        isFavorite,
      })
      setHighlights((prev) => [...prev, data.highlight])
      selectionRef.current = null
      setSelection(null)
      setNoteMode(false)
      setNoteDraft('')
      window.getSelection()?.removeAllRanges()
      setToast(
        mensaje ||
          (isFavorite ? 'Guardado en favoritos.' : note ? 'Nota añadida.' : 'Resaltado guardado.')
      )
    } catch (err) {
      setToast(err.message || 'No se pudo guardar el resaltado.')
    } finally {
      setSaving(false)
    }
  }

  const abrirEdicion = (highlight) => {
    setEditing(highlight)
    setEditColor(highlight.color)
    setEditNote(highlight.note || '')
    setEditFavorite(Boolean(highlight.isFavorite))
  }

  const guardarEdicion = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const data = await api.updateHighlight(editing.id, {
        color: editColor,
        note: editNote,
        isFavorite: editFavorite,
      })
      setHighlights((prev) => prev.map((item) => (item.id === data.highlight.id ? data.highlight : item)))
      setEditing(null)
      setToast('Resaltado actualizado.')
    } catch (err) {
      setToast(err.message || 'No se pudo actualizar el resaltado.')
    } finally {
      setSaving(false)
    }
  }

  const borrarResaltado = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.deleteHighlight(editing.id)
      setHighlights((prev) => prev.filter((item) => item.id !== editing.id))
      setEditing(null)
      setToast('Resaltado eliminado.')
    } catch (err) {
      setToast(err.message || 'No se pudo eliminar el resaltado.')
    } finally {
      setSaving(false)
    }
  }

  const renderSegmentos = (texto, blockIndex) => {
    const rangos = highlights
      .filter((item) => item.page === index && item.blockIndex === blockIndex)
      .sort((a, b) => a.startOffset - b.startOffset)
    const segmentos = []
    let cursor = 0
    for (const item of rangos) {
      const start = Math.max(0, Math.min(item.startOffset, texto.length))
      const end = Math.max(start, Math.min(item.endOffset, texto.length))
      if (start > cursor) {
        segmentos.push({ key: `t-${blockIndex}-${cursor}`, texto: texto.slice(cursor, start) })
      }
      if (end > start) {
        segmentos.push({
          key: `h-${item.id}`,
          texto: texto.slice(start, end),
          highlight: item,
        })
      }
      cursor = Math.max(cursor, end)
    }
    if (cursor < texto.length) {
      segmentos.push({ key: `t-${blockIndex}-${cursor}-end`, texto: texto.slice(cursor) })
    }
    return segmentos.map((segmento) =>
      segmento.highlight ? (
        <mark
          key={segmento.key}
          className={`lector-mark lector-mark-${segmento.highlight.color} ${
            flashId === segmento.highlight.id ? 'lector-mark-flash' : ''
          }`}
          data-note={segmento.highlight.note ? '1' : '0'}
          data-fav={segmento.highlight.isFavorite ? '1' : '0'}
          data-hid={segmento.highlight.id}
          title={segmento.highlight.note || 'Resaltado: clic para editar'}
          onClick={() => {
            if (window.getSelection()?.toString()) return
            abrirEdicion(segmento.highlight)
          }}
        >
          {segmento.texto}
          {segmento.highlight.isFavorite && (
            <span className="lector-mark-star" aria-label="Favorito">
              ★
            </span>
          )}
        </mark>
      ) : (
        <span key={segmento.key}>{segmento.texto}</span>
      )
    )
  }

  const guardarActividad = async (type, answer) => {
    setSavingActivity(true)
    try {
      const data = await api.submitActivity(bookId, {
        blockIndex: index,
        type,
        answer,
      })
      const siguiente = { ...activitiesRef.current, [index]: data.result }
      activitiesRef.current = siguiente
      setActivities(siguiente)
      totalsRef.current = data.totals
      setActivityTotals(data.totals)
      return data.result
    } catch (err) {
      setToast(err.message || 'No se pudo guardar la actividad.')
      return null
    } finally {
      setSavingActivity(false)
    }
  }

  const validarTrivia = async () => {
    if (!selectedOption || !page?.trivia) return
    const result = await guardarActividad('trivia', selectedOption)
    if (!result) return
    setIsCorrect(Boolean(result.isCorrect))
    setShowFeedback(true)
    setToast(result.isCorrect ? 'Respuesta correcta guardada.' : 'Respuesta guardada.')
  }

  const enviarReflexion = async () => {
    if (!reflectionText.trim()) return
    const result = await guardarActividad('reflection', reflectionText)
    if (!result) return
    setReflectionDone(true)
    setToast('Reflexión guardada.')
  }

  const terminarLectura = () => {
    registrarCierre()
    setToast('Lectura completada. Registramos el cierre en tu historial.')
    setTimeout(() => navigate('/lectura'), 400)
  }

  const irAPagina = (nextIndex) => {
    setPageLoading(true)
    setIndex(nextIndex)
  }

  const irAMarca = (marca) => {
    setMarksOpen(false)
    setFlashId(marca.id)
    if (marca.page !== index) irAPagina(marca.page)
    setTimeout(() => setFlashId(null), 2400)
  }

  const borrarMarca = async (marca) => {
    try {
      await api.deleteHighlight(marca.id)
      setHighlights((prev) => prev.filter((item) => item.id !== marca.id))
      setToast('Marca eliminada.')
    } catch (err) {
      setToast(err.message || 'No se pudo borrar la marca.')
    }
  }

  const alternarFavoritoMarca = async (marca) => {
    try {
      const data = await api.updateHighlight(marca.id, { isFavorite: !marca.isFavorite })
      setHighlights((prev) =>
        prev.map((item) => (item.id === marca.id ? { ...item, ...data.highlight } : item))
      )
      setToast(data.highlight.isFavorite ? 'Guardado en favoritos.' : 'Quitado de favoritos.')
    } catch (err) {
      setToast(err.message || 'No se pudo actualizar el favorito.')
    }
  }

  const editarMarca = (marca) => {
    setMarksOpen(false)
    abrirEdicion(marca)
  }

  if (loading) return <LoadingScreen label="Validando préstamo y abriendo el libro…" />

  if (blocked) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-surface-container-lowest max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-headline-sm text-headline-sm font-serif font-bold text-on-surface">
              Lectura no disponible
            </h1>
            <p className="text-body-sm text-on-surface-variant max-w-sm mt-1">{blocked.message}</p>
            <p className="text-xs text-on-surface-variant/80 mt-2">
              El acceso se cierra cuando el préstamo vence o se registra la devolución.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <Link
              to="/mis-prestamos"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-primary text-on-primary text-xs font-bold"
            >
              Ir a mis préstamos
            </Link>
            <Link
              to="/catalogo"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
            >
              Catálogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (meta && meta.total === 0) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-surface-container-lowest max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/30 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-secondary">menu_book</span>
          <h1 className="font-headline-sm font-serif font-bold text-on-surface">
            Este libro aún no tiene contenido digital
          </h1>
          <p className="text-sm text-on-surface-variant">
            El préstamo está activo, pero la biblioteca todavía no cargó sus bloques de lectura.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <Link
              to="/lectura"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold"
            >
              Volver a mis lecturas
            </Link>
            <Link
              to="/comprension"
              className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
            >
              Ver resumen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!meta || !page) return <LoadingScreen label="Cargando página…" />

  const modoActual = readingModes[mode]

  return (
    <div className="w-full relative min-h-screen lector-contenido">
      <header className="sticky top-16 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto min-w-0">
            <Link
              to="/lectura"
              aria-label="Volver a mis lecturas"
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold font-serif">
                  {meta.book.title}
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-xs font-medium whitespace-nowrap">
                  Edición digital
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-on-surface-variant truncate">
                <span className="truncate">{meta.book.author}</span>
                <span>•</span>
                <span className="font-mono text-secondary truncate">{meta.book.signature}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
            <button
              type="button"
              data-testid="abrir-mis-marcas"
              onClick={() => setMarksOpen(true)}
              className="flex items-center gap-1.5 min-h-[44px] px-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-[11px] font-semibold hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-base">bookmarks</span>
              Mis marcas ({highlights.length})
            </button>

            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-low text-secondary font-label-md text-[11px] font-semibold">
              <span className="material-symbols-outlined text-base">insights</span>
              Aciertos {activityTotals.correct} de {activityTotals.totalTrivias}
            </span>

            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-outline-variant/20">
              <button
                type="button"
                aria-label="Disminuir tamaño de letra"
                className="w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface font-bold text-xs"
                onClick={() => setFontIndex((value) => Math.max(0, value - 1))}
              >
                A-
              </button>
              <span className="px-1 text-[11px] font-semibold text-on-surface">{fontSizes[fontIndex]}px</span>
              <button
                type="button"
                aria-label="Aumentar tamaño de letra"
                className="w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface font-bold text-xs"
                onClick={() => setFontIndex((value) => Math.min(fontSizes.length - 1, value + 1))}
              >
                A+
              </button>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 gap-0.5 border border-outline-variant/20">
              {Object.entries(readingModes).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  aria-label={`Tema ${value.label}`}
                  aria-pressed={mode === key}
                  className={`min-w-[44px] min-h-[44px] px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                    mode === key
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: value.swatch }} />
                  <span className="hidden sm:inline">{value.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1720px] mx-auto w-full px-3 sm:px-6 pb-2">
          <div
            data-testid="barra-resaltado"
            className="rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-2 flex flex-col gap-1.5"
          >
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
              {colores.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  data-testid={`resaltar-${color.key}`}
                  aria-label={`Resaltar en ${color.label.toLowerCase()}`}
                  disabled={!selection || saving}
                  onPointerDown={mantenerSeleccion}
                  onTouchStart={mantenerSeleccion}
                  onClick={() =>
                    crearResaltado(
                      color.key,
                      '',
                      false,
                      `Resaltado ${color.label.toLowerCase()} guardado.`
                    )
                  }
                  className="min-h-[44px] px-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: color.swatch }}
                  />
                  {color.label}
                </button>
              ))}
              <button
                type="button"
                data-testid="anadir-nota"
                disabled={!selection || saving}
                onPointerDown={mantenerSeleccion}
                onTouchStart={mantenerSeleccion}
                onClick={() => setNoteMode(true)}
                className="min-h-[44px] px-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                Añadir nota
              </button>
              <button
                type="button"
                data-testid="guardar-favorito"
                disabled={!selection || saving}
                onPointerDown={mantenerSeleccion}
                onTouchStart={mantenerSeleccion}
                onClick={() => crearResaltado(noteColor, '', true, 'Guardado en favoritos.')}
                className="min-h-[44px] px-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">star</span>
                Guardar en favoritos
              </button>
              <button
                type="button"
                data-testid="quitar-marca"
                disabled={!selection?.highlightId || saving}
                onPointerDown={mantenerSeleccion}
                onTouchStart={mantenerSeleccion}
                onClick={quitarSeleccionada}
                className="min-h-[44px] px-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">format_color_reset</span>
                Quitar marca
              </button>
            </div>
            <p className="text-[11px] leading-snug text-on-surface-variant" data-testid="ayuda-seleccion">
              {selection
                ? `Seleccionado: “${selection.text.slice(0, 60)}${selection.text.length > 60 ? '…' : ''}”`
                : 'Selecciona un texto del libro para resaltarlo, anotarlo o guardarlo.'}
            </p>
          </div>
        </div>

        <div className="w-full bg-surface-container h-1 relative overflow-hidden">
          <div
            className="bg-secondary h-full transition-all duration-300"
            style={{ width: `${((index + 1) / meta.total) * 100}%` }}
          />
        </div>
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-1 flex items-center justify-between text-on-surface-variant text-[10px] sm:text-[11px] bg-surface-container-low/40">
          <span>
            Folio {page.folio} • Sección {index + 1} de {meta.total}
          </span>
          <span className="font-semibold">
            {Math.round(((index + 1) / meta.total) * 100)}% de avance · Límite {page.dueDate || '—'}
          </span>
        </div>
      </header>

      <div className="max-w-[1720px] mx-auto w-full px-3 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 flex flex-col gap-4 relative min-w-0">
            <article
              ref={articleRef}
              data-testid="lector-articulo"
              onContextMenu={(event) => bloquear(event, 'El clic derecho está deshabilitado en el visor.')}
              onCopy={(event) => bloquear(event, 'El contenido está protegido: copiar no está permitido.')}
              onCut={(event) => bloquear(event, 'El contenido está protegido: cortar no está permitido.')}
              onDragStart={(event) => bloquear(event, 'No se puede arrastrar el contenido del libro.')}
              onMouseUp={capturarSeleccion}
              onTouchEnd={capturarSeleccion}
              onKeyUp={capturarSeleccion}
              className="relative rounded-xl p-5 sm:p-8 md:p-12 shadow-sm transition-colors duration-300 overflow-hidden border border-outline-variant/20"
              style={{ backgroundColor: modoActual.bg, color: modoActual.color }}
            >
              {pageLoading && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded bg-black/5 text-[10px]">
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Validando préstamo…
                </div>
              )}

              {/* Marca de agua con nombre y correo del lector */}
              <div
                aria-hidden="true"
                data-testid="marca-agua"
                className="absolute inset-0 pointer-events-none select-none opacity-[0.055] flex flex-wrap items-center justify-around p-4 rotate-[-18deg] z-10 text-[10px] sm:text-xs font-mono font-bold uppercase"
              >
                {Array.from({ length: 20 }).map((_, position) => (
                  <span key={position} className="m-4 sm:m-6 whitespace-nowrap">
                    {meta.user.nombre} · {meta.user.correo}
                  </span>
                ))}
              </div>

              <div className="relative z-0 flex items-center justify-between pb-5 mb-6 text-[10px] sm:text-xs tracking-widest uppercase border-b border-outline-variant/20 gap-3">
                <span className="font-medium">{page.chapter}</span>
                <span className="font-bold text-secondary whitespace-nowrap">FOLIO {page.folio}</span>
              </div>

              <div
                className="relative z-0 leading-relaxed text-justify space-y-5 font-serif lector-texto"
                style={{ fontSize: `${fontSizes[fontIndex]}px`, lineHeight: `${fontSizes[fontIndex] * 1.7}px` }}
              >
                {page.paragraphs.map((paragraph, blockIndex) => (
                  <p key={`${index}-${blockIndex}`} data-block-index={blockIndex} data-testid="lector-parrafo">
                    {renderSegmentos(paragraph, blockIndex)}
                  </p>
                ))}
              </div>

              <footer className="relative z-0 mt-8 pt-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => irAPagina(Math.max(0, index - 1))}
                  className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg text-xs font-semibold transition-all ${
                    index === 0
                      ? 'bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Página anterior
                </button>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span>Página</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high font-bold text-on-surface">
                    {page.folio}
                  </span>
                  <span>de {meta.total}</span>
                </div>

                <button
                  type="button"
                  data-testid="lector-siguiente"
                  onClick={() => {
                    if (index < meta.total - 1) irAPagina(index + 1)
                    else terminarLectura()
                  }}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>{index < meta.total - 1 ? 'Siguiente página' : 'Finalizar lectura'}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </footer>

              {index === meta.total - 1 && (
                <div className="relative z-0 mt-4 flex justify-center">
                  <Link
                    to="/comprension"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-outline-variant/40 text-on-surface text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base">insights</span>
                    Ver resumen de comprensión
                  </Link>
                </div>
              )}
            </article>

            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 px-1">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Contenido protegido. Copiar, imprimir y guardar están deshabilitados; los intentos quedan asociados a tu
              cuenta.
            </p>
          </section>

          <aside data-testid="lector-panel" className="lg:col-span-5 flex flex-col gap-5 min-w-0">
            <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/20">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">psychology</span>
                  <h2 className="font-title-md font-bold text-on-surface font-serif">Comprensión curricular</h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                  Folio {page.folio}
                </span>
              </div>

              {page.trivia && (
                <div className="bg-surface-container-low rounded-xl p-3 sm:p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-secondary">
                      {page.trivia.type === 'reflection' ? 'Pregunta de reflexión' : 'Trivia express'}
                    </span>
                    {activities[index] && (
                      <span
                        data-testid="actividad-completada"
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 font-semibold"
                      >
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Completado
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-on-surface leading-snug">{page.trivia.question}</p>

                  {page.trivia.type === 'reflection' || !page.trivia.options?.length ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={3}
                        data-testid="reflexion"
                        value={reflectionText}
                        disabled={reflectionDone}
                        onChange={(event) => setReflectionText(event.target.value)}
                        placeholder="Escribe tu reflexión…"
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-xs focus:outline-none resize-y"
                      />
                      <button
                        type="button"
                        data-testid="guardar-reflexion"
                        disabled={!reflectionText.trim() || savingActivity || reflectionDone}
                        onClick={enviarReflexion}
                        className="min-h-[44px] w-full rounded-lg bg-secondary text-on-secondary text-xs font-bold disabled:opacity-50"
                      >
                        {savingActivity
                          ? 'Guardando…'
                          : reflectionDone
                            ? 'Respuesta guardada'
                            : 'Guardar reflexión'}
                      </button>
                      {page.trivia.explanation && (
                        <p className="text-[11px] text-on-surface-variant">{page.trivia.explanation}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 pt-1">
                        {page.trivia.options.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-start gap-2.5 p-3 rounded-lg cursor-pointer text-xs transition-all border ${
                              selectedOption === option.id
                                ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
                                : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`trivia-${page.folio}`}
                              disabled={Boolean(activities[index])}
                              checked={selectedOption === option.id}
                              onChange={() => {
                                setSelectedOption(option.id)
                                setShowFeedback(false)
                              }}
                              className="mt-0.5 cursor-pointer"
                            />
                            <span className="flex flex-col">
                              <span className="font-semibold">
                                [{option.id}] {option.text}
                              </span>
                              <span className="text-[10px] text-on-surface-variant/80 mt-0.5">{option.hint}</span>
                            </span>
                          </label>
                        ))}

                        <button
                          type="button"
                          data-testid="validar-trivia"
                          disabled={!selectedOption || savingActivity || Boolean(activities[index])}
                          onClick={validarTrivia}
                          className="mt-1 min-h-[44px] w-full rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingActivity
                            ? 'Guardando…'
                            : activities[index]
                              ? 'Respuesta guardada'
                              : 'Validar respuesta'}
                        </button>
                      </div>

                      {showFeedback && (
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isCorrect
                              ? 'bg-green-100 text-green-950 border border-green-300'
                              : 'bg-red-100 text-red-950 border border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span className="material-symbols-outlined text-sm">
                              {isCorrect ? 'check_circle' : 'cancel'}
                            </span>
                            <span>
                              {isCorrect ? '¡Correcto!' : 'Respuesta errónea'}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-90">{page.trivia.explanation}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {page.glossary?.length > 0 && (
                <details className="rounded-lg bg-surface-container-low px-3 py-2">
                  <summary className="text-xs font-bold text-on-surface cursor-pointer">
                    Vocabulario filológico
                  </summary>
                  <div className="space-y-2">
                    {page.glossary.map((item) => (
                      <div
                        key={item.term}
                        className="p-2.5 rounded-lg bg-surface-container-low text-xs flex flex-col gap-0.5 border border-outline-variant/10"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-secondary">{item.term}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono whitespace-nowrap">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">{item.def}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 text-[11px] text-on-surface-variant flex items-start gap-2 border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-base">gesture</span>
              <p>
                Selecciona un fragmento del texto para resaltarlo en amarillo, verde o azul, o para añadir una nota.
                Haz clic en un resaltado existente para editarlo o quitarlo.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Editor de nota para la selección actual */}
      {noteMode && selection && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-xl shadow-2xl border border-outline-variant/30 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-title-md font-bold text-on-surface">Añadir nota</h3>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setNoteMode(false)
                  setNoteDraft('')
                }}
                className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-2 line-clamp-3">
              “{selection.text}”
            </p>
            <div className="flex items-center gap-2">
              {colores.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  aria-label={`Color ${color.label}`}
                  onClick={() => setNoteColor(color.key)}
                  className={`w-11 h-11 rounded-full border-2 ${
                    noteColor === color.key ? 'border-on-surface' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.swatch }}
                />
              ))}
              <span className="text-[10px] text-on-surface-variant ml-auto">{noteDraft.length}/500</span>
            </div>
            <textarea
              data-testid="nota-nueva"
              autoFocus
              rows={3}
              maxLength={500}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Escribe tu nota…"
              className="w-full text-xs p-2.5 rounded-lg bg-surface-container-low text-on-surface focus:outline-none resize-y"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoteMode(false)
                  setNoteDraft('')
                }}
                className="min-h-[44px] px-3 rounded-lg bg-surface-container text-on-surface text-[11px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="nota-nueva-guardar"
                disabled={saving || !noteDraft.trim()}
                onClick={() => crearResaltado(noteColor, noteDraft, false, 'Nota añadida.')}
                className="min-h-[44px] px-3 rounded-lg bg-primary text-on-primary text-[11px] font-bold disabled:opacity-50"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de marcas del libro abierto */}
      {marksOpen && (
        <div className="fixed inset-0 z-[65]">
          <button
            type="button"
            aria-label="Cerrar mis marcas"
            onClick={() => setMarksOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside
            data-testid="panel-mis-marcas"
            className="absolute inset-x-0 bottom-0 max-h-[78vh] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[400px] lg:max-h-none bg-surface-container-lowest rounded-t-2xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-outline-variant/30 shadow-2xl flex flex-col"
          >
            <header className="flex items-center justify-between gap-2 p-3 border-b border-outline-variant/25">
              <div className="flex flex-col">
                <h2 className="font-title-md font-bold text-on-surface font-serif">Mis marcas</h2>
                <span className="text-[11px] text-on-surface-variant">
                  {highlights.length} en este libro
                </span>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setMarksOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {highlights.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">
                  Aún no tienes marcas en este libro. Selecciona un texto y usa la barra de arriba.
                </p>
              ) : (
                [...highlights]
                  .sort((a, b) => a.page - b.page || a.startOffset - b.startOffset)
                  .map((marca) => (
                    <article
                      key={marca.id}
                      data-testid="marca-item"
                      className="rounded-xl border border-outline-variant/25 bg-surface-container-low/40 p-2.5 flex flex-col gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => irAMarca(marca)}
                        className="text-left flex items-start gap-2 min-h-[44px]"
                      >
                        <span
                          className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                            marca.color === 'verde'
                              ? 'bg-green-400'
                              : marca.color === 'azul'
                                ? 'bg-blue-400'
                                : 'bg-yellow-300'
                          }`}
                        />
                        <span className="flex-1 text-xs text-on-surface leading-snug">
                          “{marca.text}”
                        </span>
                        {marca.isFavorite && (
                          <span
                            className="material-symbols-outlined text-base text-amber-600"
                            aria-label="Favorito"
                          >
                            star
                          </span>
                        )}
                      </button>
                      {marca.note && (
                        <p className="text-[11px] text-on-surface bg-surface-container-low rounded-md p-2 whitespace-pre-wrap">
                          {marca.note}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-on-surface-variant">
                        <span>Página {marca.page + 1}</span>
                        <button
                          type="button"
                          aria-label={marca.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                          onClick={() => alternarFavoritoMarca(marca)}
                          className={`min-h-[44px] min-w-[44px] flex items-center justify-center ${
                            marca.isFavorite ? 'text-amber-600' : 'text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {marca.isFavorite ? 'star' : 'star_border'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => editarMarca(marca)}
                          className="min-h-[44px] px-2 text-[11px] font-semibold text-secondary"
                        >
                          Editar nota
                        </button>
                        <button
                          type="button"
                          onClick={() => borrarMarca(marca)}
                          className="min-h-[44px] px-2 text-[11px] font-semibold text-red-700"
                        >
                          Borrar
                        </button>
                      </div>
                    </article>
                  ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Edición de un resaltado existente */}
      {editing && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-title-md font-bold text-on-surface">Editar resaltado</h3>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
                className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-2.5 line-clamp-3">
              “{editing.text}”
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {colores.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  aria-label={`Color ${color.label}`}
                  onClick={() => setEditColor(color.key)}
                  className={`w-11 h-11 rounded-full border-2 ${
                    editColor === color.key ? 'border-on-surface' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.swatch }}
                />
              ))}
              <button
                type="button"
                onClick={() => setEditFavorite((value) => !value)}
                className={`min-h-[44px] px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                  editFavorite
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {editFavorite ? 'star' : 'star_border'}
                </span>
                {editFavorite ? 'En favoritos' : 'Guardar en favoritos'}
              </button>
              <span className="text-[11px] text-on-surface-variant ml-auto">{editNote.length}/500</span>
            </div>
            <textarea
              data-testid="nota-editor"
              rows={3}
              maxLength={500}
              value={editNote}
              onChange={(event) => setEditNote(event.target.value)}
              placeholder="Nota (opcional)"
              className="w-full text-xs p-2.5 rounded-lg bg-surface-container-low text-on-surface focus:outline-none resize-y"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                data-testid="nota-borrar"
                onClick={borrarResaltado}
                disabled={saving}
                className="min-h-[44px] px-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold disabled:opacity-50"
              >
                Quitar resaltado
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-[44px] px-3 rounded-lg bg-surface-container-high text-on-surface text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="nota-guardar"
                onClick={guardarEdicion}
                disabled={saving}
                className="min-h-[44px] px-3 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] max-w-[92vw] px-4 py-2.5 rounded-lg bg-on-surface text-surface text-xs font-medium shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Lector
