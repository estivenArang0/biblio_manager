import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface p-space-md">
      <div className="w-full max-w-xl text-center">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
          Error 404
        </p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-space-sm">
          Esta página no existe
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
          La dirección que abriste no pertenece al portal o fue movida. Revisa el enlace o vuelve
          al catálogo para seguir consultando el acervo.
        </p>
        <div className="flex flex-col sm:flex-row gap-space-sm justify-center mt-space-lg">
          <Link
            to="/catalogo"
            className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary/90 transition-colors"
          >
            Ir al catálogo
          </Link>
          <Link
            to="/"
            className="px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound
