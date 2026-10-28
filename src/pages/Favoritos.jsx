import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

const TABS = [
  { key: 'todo', label: 'Todo' },
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'resaltados', label: 'Resaltados' },
  { key: 'notas', label: 'Notas' },
]

function fecha(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function tono(color) {
  if (color === 'verde') return 'bg-green-400'
  if (color === 'azul') return 'bg-blue-400'
  return 'bg-yellow-300'
}

function tieneNota(fragment) {
  return Boolean(fragment.note && fragment.note.trim())
}

function Favoritos() {
  const [fragments, setFragments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [tab, setTab] = useState('todo')
  const [bookFilter, setBookFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [editColor, setEditColor] = useState('amarillo')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const data = await api.fragments()
      setFragments(data.fragments)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus fragmentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!aviso) return undefined
    const timer = setTimeout(() => setAviso(''), 2400)
    return () => clearTimeout(timer)
  }, [aviso])

  const libros = useMemo(() => {
    const map = new Map()
    fragments.forEach((fragment) => map.set(fragment.bookId, fragment.title))
    return [...map.entries()].map(([id, title]) => ({ id, title }))
  }, [fragments])

  const conteos = useMemo(
    () => ({
      todo: fragments.length,
      favoritos: fragments.filter((fragment) => fragment.isFavorite).length,
      resaltados: fragments.filter((fragment) => !tieneNota(fragment)).length,
      notas: fragments.filter(tieneNota).length,
    }),
    [fragments]
  )

  const visibles = useMemo(() => {
    const porTab = fragments.filter((fragment) => {
      if (tab === 'favoritos') return fragment.isFavorite
      if (tab === 'notas') return tieneNota(fragment)
      if (tab === 'resaltados') return !tieneNota(fragment)
      return true
    })
    const porLibro = bookFilter
      ? porTab.filter((fragment) => fragment.bookId === bookFilter)
      : porTab
    return [...porLibro].sort((a, b) =>
      String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt))
    )
  }, [fragments, tab, bookFilter])

  const alternarFavorito = async (fragment) => {
    try {
      const data = await api.updateHighlight(fragment.id, { isFavorite: !fragment.isFavorite })
      setFragments((current) =>
        current.map((item) => (item.id === fragment.id ? { ...item, ...data.highlight } : item))
      )
      setAviso(data.highlight.isFavorite ? 'Guardado en favoritos.' : 'Quitado de favoritos.')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el favorito.')
    }
  }

  const abrirEdicion = (fragment) => {
    setEditing(fragment)
    setEditColor(fragment.color)
    setEditNote(fragment.note || '')
  }

  const guardarNota = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const data = await api.updateHighlight(editing.id, {
        color: editColor,
        note: editNote,
        isFavorite: editing.isFavorite,
      })
      setFragments((current) =>
        current.map((item) => (item.id === editing.id ? { ...item, ...data.highlight } : item))
      )
      setEditing(null)
      setAviso('Nota actualizada.')
    } catch (err) {
      setError(err.message || 'No se pudo guardar la nota.')
    } finally {
      setSaving(false)
    }
  }

  const borrar = async (fragment) => {
    setSaving(true)
    try {
      await api.deleteHighlight(fragment.id)
      setFragments((current) => current.filter((item) => item.id !== fragment.id))
      if (editing && editing.id === fragment.id) setEditing(null)
      setAviso('Marca eliminada.')
    } catch (err) {
      setError(err.message || 'No se pudo borrar la marca.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen label="Cargando favoritos y notas…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-4xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Mis fragmentos
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Favoritos y notas
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Todo lo que marcaste en tus libros: resaltados, notas y favoritos.
        </p>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-2 flex flex-col gap-2">
        <div role="tablist" aria-label="Tipo de marca" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              data-testid={`tab-${item.key}`}
              onClick={() => setTab(item.key)}
              className={`min-h-[44px] px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                tab === item.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {item.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  tab === item.key ? 'bg-black/15' : 'bg-surface-container-high'
                }`}
              >
                {conteos[item.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrar por libro"
            value={bookFilter}
            onChange={(event) => setBookFilter(event.target.value)}
            className="min-h-[44px] flex-1 min-w-[180px] px-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
          >
            <option value="">Todos los libros</option>
            {libros.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-on-surface-variant ml-auto" data-testid="conteo-visible">
            {visibles.length} {visibles.length === 1 ? 'marca' : 'marcas'}
          </span>
        </div>
      </section>

      {visibles.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">star</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">
            Aún no tienes marcas
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md" data-testid="vacio-marcas">
            Aún no tienes marcas. Abre un libro desde Mis préstamos, selecciona un texto y usa la barra
            de arriba.
          </p>
          <Link
            to="/lectura"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Ir a mis lecturas
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-2" data-testid="lista-marcas">
          {visibles.map((fragment) => (
            <article
              key={fragment.id}
              data-testid="marca-card"
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 sm:p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-title-sm font-serif font-bold text-on-surface truncate">
                    {fragment.title}
                  </h2>
                  <p className="text-[10px] text-on-surface-variant">
                    Página {fragment.block} · {fecha(fragment.updatedAt || fragment.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={fragment.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  onClick={() => alternarFavorito(fragment)}
                  className={`w-11 h-11 -mr-2 -mt-2 flex items-center justify-center shrink-0 ${
                    fragment.isFavorite ? 'text-amber-600' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {fragment.isFavorite ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>

              <div className="flex items-start gap-2">
                <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${tono(fragment.color)}`} />
                <p className="flex-1 text-sm text-on-surface leading-relaxed">
                  “{fragment.text}”{' '}
                  {fragment.isFavorite && (
                    <span className="text-amber-600" aria-label="Favorito">
                      ★
                    </span>
                  )}
                </p>
              </div>

              {tieneNota(fragment) && (
                <p className="text-xs text-on-surface bg-surface-container-low rounded-lg p-2 whitespace-pre-wrap">
                  {fragment.note}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {fragment.canRead ? (
                  <Link
                    to={`/lectura/${fragment.bookId}?page=${fragment.page}`}
                    className="min-h-[44px] inline-flex items-center px-3 rounded-lg bg-primary text-on-primary text-[11px] font-bold"
                  >
                    Abrir en el libro
                  </Link>
                ) : (
                  <span className="min-h-[44px] inline-flex items-center px-1 text-[11px] text-on-surface-variant">
                    Solo fragmento (préstamo vencido)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => abrirEdicion(fragment)}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-semibold"
                >
                  Editar nota
                </button>
                <button
                  type="button"
                  onClick={() => alternarFavorito(fragment)}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container text-on-surface text-[11px] font-semibold"
                >
                  {fragment.isFavorite ? 'Favorito: sí' : 'Favorito: no'}
                </button>
                <button
                  type="button"
                  onClick={() => borrar(fragment)}
                  disabled={saving}
                  className="min-h-[44px] px-3 rounded-lg text-red-700 border border-red-200 text-[11px] font-semibold disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl w-full max-w-md p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-title-md font-bold text-on-surface">Editar marca</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
                className="w-11 h-11 -mr-2 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-2.5 line-clamp-3">
              “{editing.text}”
            </p>
            <div className="flex items-center gap-2">
              {[
                ['amarillo', 'bg-yellow-300'],
                ['verde', 'bg-green-400'],
                ['azul', 'bg-blue-400'],
              ].map(([key, tone]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Color ${key}`}
                  onClick={() => setEditColor(key)}
                  className={`w-11 h-11 rounded-full border-2 ${tone} ${
                    editColor === key ? 'border-on-surface' : 'border-transparent'
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={() => setEditing((current) => ({ ...current, isFavorite: !current.isFavorite }))}
                className={`min-h-[44px] px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                  editing.isFavorite
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {editing.isFavorite ? 'star' : 'star_border'}
                </span>
                {editing.isFavorite ? 'En favoritos' : 'Guardar en favoritos'}
              </button>
              <span className="text-[10px] text-on-surface-variant ml-auto">{editNote.length}/500</span>
            </div>
            <textarea
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
                onClick={() => borrar(editing)}
                disabled={saving}
                className="min-h-[44px] px-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold disabled:opacity-50"
              >
                Borrar
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
                onClick={guardarNota}
                disabled={saving}
                className="min-h-[44px] px-3 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] max-w-[92vw] px-4 py-2.5 rounded-lg bg-on-surface text-surface text-xs font-medium shadow-xl">
          {aviso}
        </div>
      )}
    </div>
  )
}

export default Favoritos
