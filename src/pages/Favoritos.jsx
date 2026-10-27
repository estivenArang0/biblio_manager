import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCard from '../components/BookCard'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function Favoritos() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const data = await api.favorites()
      setBooks(data.books)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus favoritos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  const quitar = async (book) => {
    try {
      await api.removeFavorite(book.id)
      await cargar()
    } catch (err) {
      setFeedback(err.message || 'No se pudo quitar de favoritos.')
    }
  }

  const solicitar = async (book) => {
    setFeedback(null)
    try {
      await api.requestLoan(book.id)
      await cargar()
      setFeedback(`Solicitud enviada para "${book.title}".`)
    } catch (err) {
      setFeedback(err.message || 'No se pudo enviar la solicitud.')
    }
  }

  if (loading) return <LoadingScreen label="Cargando favoritos…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Mi selección
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Favoritos</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Libros que guardaste para leer más tarde.
        </p>
      </header>

      {error && <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>}
      {feedback && (
        <div className="p-3 rounded-lg bg-surface-container-low text-on-surface text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">info</span>
          <span className="flex-1">{feedback}</span>
          <button type="button" aria-label="Cerrar" onClick={() => setFeedback(null)}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {books.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">favorite</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">Aún no tienes favoritos</h2>
          <Link
            to="/catalogo"
            className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRequest={solicitar}
              onFavorite={quitar}
              requesting={false}
              esStaff={false}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export default Favoritos
