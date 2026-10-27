import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function fecha(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Favoritos() {
  const [fragments, setFragments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soloFavoritos, setSoloFavoritos] = useState(true)
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

  const libros = useMemo(() => {
    const map = new Map()
    fragments.forEach((fragment) => map.set(fragment.bookId, fragment.title))
    return [...map.entries()].map(([id, title]) => ({ id, title }))
  }, [fragments])

  const visibles = useMemo(
    () =>
      fragments.filter(
        (fragment) =>
          (!soloFavoritos || fragment.isFavorite) &&
          (!bookFilter || fragment.bookId === bookFilter)
      ),
    [fragments, soloFavoritos, bookFilter]
  )

  const grupos = useMemo(() => {
    const map = new Map()
    visibles.forEach((fragment) => {
      if (!map.has(fragment.bookId)) map.set(fragment.bookId, { title: fragment.title, items: [] })
      map.get(fragment.bookId).items.push(fragment)
    })
    return [...map.values()]
  }, [visibles])

  const alternarFavorito = async (fragment) => {
    try {
      const data = await api.updateHighlight(fragment.id, { isFavorite: !fragment.isFavorite })
      setFragments((current) =>
        current.map((item) => (item.id === fragment.id ? { ...item, ...data.highlight } : item))
      )
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
    } catch (err) {
      setError(err.message || 'No se pudo guardar la nota.')
    } finally {
      setSaving(false)
    }
  }

  const borrar = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.deleteHighlight(editing.id)
      setFragments((current) => current.filter((item) => item.id !== editing.id))
      setEditing(null)
    } catch (err) {
      setError(err.message || 'No se pudo borrar el fragmento.')
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
          Fragmentos que guardaste, agrupados por libro.
        </p>
      </header>

      {error && <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
        <select
          aria-label="Filtrar por libro"
          value={bookFilter}
          onChange={(event) => setBookFilter(event.target.value)}
          className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
        >
          <option value="">Todos los libros</option>
          {libros.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 min-h-[44px] px-2 text-xs text-on-surface">
          <input
            type="checkbox"
            checked={soloFavoritos}
            onChange={(event) => setSoloFavoritos(event.target.checked)}
            className="w-4 h-4"
          />
          Solo favoritos
        </label>
        <span className="text-[11px] text-on-surface-variant sm:ml-auto">{visibles.length} fragmentos</span>
      </section>

      {grupos.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">star</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">
            No hay fragmentos en esta vista
          </h2>
          <p className="text-sm text-on-surface-variant">
            Selecciona texto en el visor y usa “Guardar en favoritos” o “Añadir nota”.
          </p>
          <Link
            to="/lectura"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Ir a mis lecturas
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-space-md">
          {grupos.map((grupo) => (
            <div key={grupo.title} className="flex flex-col gap-2">
              <h2 className="font-title-md font-serif font-bold text-on-surface px-1">{grupo.title}</h2>
              {grupo.items.map((fragment) => (
                <article
                  key={fragment.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 sm:p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                        fragment.color === 'verde'
                          ? 'bg-green-400'
                          : fragment.color === 'azul'
                            ? 'bg-blue-400'
                            : 'bg-yellow-300'
                      }`}
                    />
                    <p className="flex-1 text-sm text-on-surface leading-relaxed">“{fragment.text}”</p>
                    <button
                      type="button"
                      aria-label={fragment.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      onClick={() => alternarFavorito(fragment)}
                      className={`w-11 h-11 -m-2 flex items-center justify-center ${
                        fragment.isFavorite ? 'text-amber-600' : 'text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {fragment.isFavorite ? 'star' : 'star_border'}
                      </span>
                    </button>
                  </div>

                  {fragment.note && (
                    <p className="text-xs text-on-surface bg-surface-container-low rounded-lg p-2 whitespace-pre-wrap">
                      {fragment.note}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-on-surface-variant">
                    <span>Bloque {fragment.block}</span>
                    <span>·</span>
                    <span>{fecha(fragment.updatedAt)}</span>
                    <span>·</span>
                    {fragment.canRead ? (
                      <Link
                        to={`/lectura/${fragment.bookId}?page=${fragment.page}`}
                        className="font-semibold text-secondary hover:underline"
                      >
                        Ir a la página
                      </Link>
                    ) : (
                      <span>Solo fragmento (sin préstamo vigente)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirEdicion(fragment)}
                      className="ml-auto min-h-[44px] px-2 text-[11px] font-semibold text-secondary"
                    >
                      Editar nota
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl w-full max-w-md p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-title-md font-bold text-on-surface">Editar fragmento</h2>
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
                onClick={borrar}
                disabled={saving}
                className="min-h-[44px] px-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold disabled:opacity-50"
              >
                Borrar fragmento
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
    </div>
  )
}

export default Favoritos
