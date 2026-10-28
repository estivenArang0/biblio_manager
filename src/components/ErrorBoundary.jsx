import { Component } from 'react'

/**
 * Captura errores de renderizado de cualquier componente hijo y muestra una
 * pantalla de recuperación en lugar de dejar la aplicación en blanco.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error no controlado:', error, info?.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.assign('/')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="min-h-screen flex items-center justify-center bg-surface p-space-md">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-lg p-space-xl text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <h1 className="font-headline-sm text-headline-sm text-on-surface mt-space-md">
            Algo salió mal
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            Ocurrió un error inesperado en esta pantalla. Puedes recargar la página o volver al
            inicio; tu sesión y tus datos no se ven afectados.
          </p>
          {error?.message && (
            <pre className="mt-space-md p-space-sm rounded-lg bg-surface-container text-on-surface-variant text-[11px] text-left overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-space-sm justify-center mt-space-lg">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary/90 transition-colors"
            >
              Recargar página
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-space-lg py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    )
  }
}

export default ErrorBoundary
