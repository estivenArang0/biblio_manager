import { useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function Comprension() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .comprehension()
      .then((data) => {
        if (alive) setBooks(data.books)
      })
      .catch((err) => {
        if (alive) setError(err.message || 'No se pudo cargar tu resumen.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <LoadingScreen label="Calculando tu comprensión…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-4xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Mi progreso
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Mi comprensión lectora
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Resumen por libro: bloques respondidos, aciertos en trivias y porcentaje.
        </p>
      </header>

      {error && <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>}

      {books.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary">insights</span>
          <p className="mt-2 text-sm text-on-surface-variant">
            Aún no tienes actividades ni préstamos para mostrar un resumen.
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-space-sm">
          {books.map((item) => (
            <article
              key={item.book.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-3 sm:p-4 flex gap-3"
            >
              <img
                src={item.book.image}
                alt={`Portada de ${item.book.title}`}
                className="w-16 h-24 object-cover rounded-lg bg-surface-container shrink-0"
              />
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-serif font-bold text-on-surface truncate">{item.book.title}</h2>
                  <p className="text-[11px] text-on-surface-variant truncate">{item.book.author}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="rounded bg-surface-container-low px-2 py-1">
                    Bloques: <strong>{item.answered}</strong> de {item.totalBlocks}
                  </span>
                  <span className="rounded bg-surface-container-low px-2 py-1">
                    Aciertos: <strong>{item.correct}</strong> de {item.totalTrivias}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                    <span>{item.message}</span>
                    <span className="font-bold text-on-surface">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container mt-1 overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default Comprension
