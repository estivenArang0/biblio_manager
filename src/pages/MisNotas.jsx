import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function MisNotas() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .notes()
      .then((data) => {
        if (alive) setNotes(data.notes)
      })
      .catch((err) => {
        if (alive) setError(err.message || 'No se pudieron cargar tus notas.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <LoadingScreen label="Cargando notas…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-4xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Mis apuntes de lectura
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Mis notas</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Notas guardadas en tus subrayados, por libro y bloque.
        </p>
      </header>

      {error && <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>}

      {notes.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">sticky_note_2</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">Aún no tienes notas</h2>
          <p className="text-sm text-on-surface-variant">Selecciona texto en el visor y usa “Añadir nota”.</p>
          <Link
            to="/lectura"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Ir a mis lecturas
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-2">
          {notes.map((note) => (
            <article key={note.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-on-surface truncate">{note.title}</h2>
                  <p className="text-[10px] text-on-surface-variant">
                    {note.author} · Bloque {note.page + 1}
                  </p>
                </div>
                <span
                  className={`w-4 h-4 rounded-full shrink-0 ${
                    note.color === 'verde'
                      ? 'bg-green-400'
                      : note.color === 'azul'
                        ? 'bg-blue-400'
                        : 'bg-yellow-300'
                  }`}
                />
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant bg-surface-container-low rounded p-2 line-clamp-2">
                “{note.text}”
              </p>
              <p className="mt-2 text-xs text-on-surface whitespace-pre-wrap">{note.note}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default MisNotas
