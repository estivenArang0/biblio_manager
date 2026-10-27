import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'
import { researchLines } from '../data/recommendations'

function Recomendaciones() {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [lecturas, setLecturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIntent, setActiveIntent] = useState('Todas las intenciones')
  const [solicitando, setSolicitando] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [booksData, readingData] = await Promise.all([api.books(), api.readingLoans()])
      setBooks(booksData.books)
      setLecturas(readingData.loans)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las recomendaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  const intents = useMemo(() => {
    const genres = new Set()
    books.forEach((book) => {
      const genre = (book.tag || book.genre || '').trim()
      if (genre) genres.add(genre)
    })
    return ['Todas las intenciones', ...Array.from(genres).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [books])

  const filtered = useMemo(() => {
    if (activeIntent === 'Todas las intenciones') return books
    return books.filter((book) => (book.tag || book.genre || '').toLowerCase().includes(activeIntent.toLowerCase()))
  }, [books, activeIntent])

  const actual = lecturas[0] || null

  const solicitar = async (book) => {
    setSolicitando(book.id)
    setFeedback(null)
    try {
      await api.requestLoan(book.id)
      await cargar()
      setFeedback({ type: 'ok', text: `Solicitud enviada para "${book.title}".` })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo enviar la solicitud.' })
    } finally {
      setSolicitando(null)
    }
  }

  if (loading) return <LoadingScreen label="Generando recomendaciones…" />

  return (
    <div className="px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-md">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary-container opacity-10 blur-2xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 text-on-primary-container font-label-sm text-label-sm mb-space-sm backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm text-secondary-container">psychology</span>
                <span>Selección por materias del acervo</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-primary tracking-tight font-serif">
                Descubre tu próxima gran lectura
              </h1>
              <p className="font-body-md text-body-md text-surface-container-highest mt-space-xs leading-relaxed">
                Sugerencias construidas a partir de las materias, autores y obras registradas en el catálogo
                institucional.
              </p>
            </div>
            <div className="flex items-center gap-space-xs text-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>{filtered.length} obras coincidentes</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <span className="font-label-sm text-label-sm text-surface-container-highest tracking-wide uppercase">
              Intención y enfoque conceptual
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {intents.map((intent) => {
                const isActive = intent === activeIntent
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setActiveIntent(intent)}
                    className={`px-3.5 min-h-[44px] rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                        : 'bg-surface-container-lowest/10 text-on-primary hover:bg-surface-container-lowest/20'
                    }`}
                  >
                    {isActive && <span className="material-symbols-outlined text-sm">check</span>}
                    <span>{intent}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-body-sm flex items-center gap-2 border ${
            feedback.type === 'ok'
              ? 'bg-green-50 text-green-900 border-green-200'
              : 'bg-error-container text-on-error-container border-red-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {feedback.type === 'ok' ? 'check_circle' : 'error'}
          </span>
          {feedback.text}
        </div>
      )}

      {actual ? (
        <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-outline-variant/20">
          <div className="flex items-start sm:items-center gap-space-md w-full md:w-auto min-w-0">
            <div className="w-16 h-24 rounded-lg bg-surface-container-low shrink-0 overflow-hidden shadow-sm">
              <img className="w-full h-full object-cover" alt={`Portada de ${actual.title}`} src={actual.image} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-secondary font-medium uppercase tracking-wider">
                Lectura en curso
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-serif font-bold truncate">
                {actual.title}
              </h2>
              <span className="font-body-md text-body-md text-on-surface-variant truncate">{actual.author}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono mt-1">
                Límite: {actual.dueDate || '—'} · {actual.daysLeft} días
              </span>
            </div>
          </div>
          <Link
            to={`/lectura/${actual.bookId}`}
            className="min-h-[44px] w-full md:w-auto inline-flex items-center justify-center gap-2 px-space-md rounded-lg bg-secondary text-on-secondary font-label-lg shadow-sm"
          >
            <span>Continuar leyendo</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-outline-variant/20">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-2xl">book</span>
            <p className="text-xs">
              <span className="font-semibold text-on-surface block">Sin lecturas digitales activas</span>
              Solicita un libro digital desde el catálogo para comenzar a leer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="min-h-[44px] px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium"
          >
            Explorar catálogo
          </button>
        </div>
      )}

      <div className="flex flex-col gap-space-md">
        <div>
          <span className="font-label-sm text-label-sm text-secondary font-medium tracking-wider uppercase">
            Sugerencias del acervo
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-serif">
            Recomendaciones para «{activeIntent}»
          </h2>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-md">
            {filtered.map((book) => (
              <article
                key={book.id}
                className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow border border-outline-variant/20"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
                    <img
                      className="w-full h-full object-cover"
                      src={book.image}
                      alt={`Portada de ${book.title}`}
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary text-on-primary shadow-sm font-medium">
                      {book.tag || 'General'}
                    </span>
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{book.author}</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mt-0.5 leading-snug font-serif font-bold">
                      {book.title}
                    </h3>
                    <p className="mt-space-xs text-[11px] text-on-surface-variant">
                      {book.availabilityLabel} · {book.descriptor || book.format}
                    </p>
                  </div>
                </div>
                <div className="pt-space-md mt-auto">
                  {book.myLoan?.status === 'activo' ? (
                    <Link
                      to={`/lectura/${book.id}`}
                      className="w-full min-h-[44px] rounded-lg bg-primary text-on-primary font-label-md flex items-center justify-center"
                    >
                      Leer
                    </Link>
                  ) : book.myLoan?.status === 'vencido' ? (
                    <Link
                      to="/mis-prestamos"
                      className="w-full min-h-[44px] rounded-lg bg-surface-container text-on-surface font-label-md flex items-center justify-center"
                    >
                      Ver mi avance
                    </Link>
                  ) : book.myLoan?.status === 'pendiente' ? (
                    <div className="w-full min-h-[44px] rounded-lg bg-surface-container text-on-surface-variant font-label-md flex items-center justify-center">
                      Solicitado
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => solicitar(book)}
                      disabled={solicitando === book.id}
                      className="w-full min-h-[44px] rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_add</span>
                      <span>{solicitando === book.id ? 'Enviando…' : 'Solicitar préstamo'}</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-surface-container-low rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">menu_book</span>
            <p className="font-headline-sm font-semibold text-on-surface">No hay obras bajo esta intención temática.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-space-md pb-space-lg">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Caminos metodológicos
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Líneas de investigación sugeridas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
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
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">{line.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-space-sm">
                  {line.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="mt-space-md inline-flex items-center gap-1 min-h-[44px] font-label-md text-label-md text-secondary hover:underline self-start"
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
