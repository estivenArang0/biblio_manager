import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function LecturaInteractiva() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function cargar() {
      try {
        const data = await api.readingLoans()
        if (alive) setLoans(data.loans)
      } catch (err) {
        if (alive) setError(err.message || 'No se pudieron cargar tus lecturas.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    cargar()
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <LoadingScreen label="Cargando lecturas disponibles…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Lectura protegida
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Lectura interactiva
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Estos son los libros digitales que tienes prestados. El contenido solo se entrega mientras el préstamo
          esté activo y vigente.
        </p>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-secondary">menu_book</span>
          <h2 className="font-headline-sm font-serif font-semibold text-on-surface">
            Aún no tienes libros prestados. Pídelos en el catálogo.
          </h2>
          <Link
            to="/catalogo"
            className="mt-2 min-h-[44px] inline-flex items-center px-4 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md" data-testid="lecturas-disponibles">
          {loans.map((loan) => (
            <article
              key={loan.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 shadow-sm p-3 flex gap-3"
            >
              <img
                src={loan.image}
                alt={`Portada de ${loan.title}`}
                className="w-20 h-28 object-cover rounded-lg bg-surface-container shrink-0"
                loading="lazy"
              />
              <div className="flex flex-col justify-between min-w-0 flex-1">
                <div className="min-w-0">
                  <h2 className="font-title-md font-serif font-bold text-on-surface leading-tight line-clamp-2">
                    {loan.title}
                  </h2>
                  <p className="text-xs text-on-surface-variant line-clamp-1">{loan.author}</p>
                  <p className="text-[10px] font-mono text-secondary mt-1">{loan.signature}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    Límite: {loan.dueDate ? new Date(`${loan.dueDate}T12:00:00`).toLocaleDateString('es-CO') : '—'}
                  </p>
                </div>
                <Link
                  to={`/lectura/${loan.bookId}`}
                  className="mt-2 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">auto_stories</span>
                  Leer
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="rounded-xl bg-surface-container-low border border-outline-variant/25 p-4 flex items-start gap-3 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-secondary text-xl">shield</span>
        <p>
          El visor incluye marca de agua con tu nombre y correo, bloqueo de copia e impresión, y cierre de sesión
          automático tras 30 minutos sin actividad. Tus subrayados y notas se guardan en tu cuenta.
        </p>
      </div>
    </div>
  )
}

export default LecturaInteractiva
