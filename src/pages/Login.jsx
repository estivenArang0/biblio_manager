import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: conectar con Firebase Authentication (signInWithEmailAndPassword)
    navigate('/recomendaciones')
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full min-h-screen flex items-center justify-center p-space-sm sm:p-space-lg lg:p-margin bg-surface">
        <div className="w-full max-w-6xl overflow-hidden rounded-xl shadow-xl bg-surface-container-lowest grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between p-space-lg sm:p-space-xl lg:p-12 bg-surface-container-lowest">
            <div>
              <div className="flex items-center space-x-3 mb-space-lg">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">local_library</span>
                </div>
                <div>
                  <span className="font-title-lg text-title-lg text-on-surface tracking-tight block leading-tight">
                    Biblio Manager
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                    Portal Bibliotecario Digital
                  </span>
                </div>
              </div>

              <div className="space-y-space-xs mb-space-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Iniciar Sesión en el Acervo
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Acceso unificado para:{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface">
                    Bibliotecario
                  </span>
                  ,{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface">
                    Docente
                  </span>{' '}
                  y{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface">
                    Estudiante
                  </span>
                  .
                </p>
              </div>

              <form className="space-y-space-md" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="institutional-email">
                    Correo Electrónico Institucional
                  </label>
                  <div className="relative rounded-lg shadow-sm bg-surface-container-low flex items-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl pl-3 pointer-events-none select-none">
                      alternate_email
                    </span>
                    <input
                      className="w-full bg-transparent px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                      id="institutional-email"
                      name="email"
                      placeholder="usuario@institucion.edu"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password-field">
                    Contraseña de Credencial
                  </label>
                  <div className="relative rounded-lg shadow-sm bg-surface-container-low flex items-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl pl-3 pointer-events-none select-none">
                      lock
                    </span>
                    <input
                      className="w-full bg-transparent px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                      id="password-field"
                      name="password"
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label="Alternar visualización de contraseña"
                      className="pr-3 text-on-surface-variant hover:text-on-surface flex items-center justify-center focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                    <input className="w-4 h-4 rounded bg-surface-container-high text-primary focus:ring-0 accent-primary cursor-pointer" type="checkbox" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Recordar credenciales en este equipo</span>
                  </label>
                  <a className="font-label-md text-label-md text-secondary hover:underline" href="#">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    className="w-full py-3 px-space-md rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg tracking-wide hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-150 shadow-sm flex items-center justify-center space-x-2"
                    type="submit"
                  >
                    <span>Iniciar sesión</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>

              <div className="mt-space-md text-center">
                <span className="font-body-sm text-body-sm text-on-surface-variant relative block">
                  <span className="bg-surface-container-lowest px-3">o ingresa con tu credencial digital universitaria</span>
                </span>
                <div className="mt-space-sm flex justify-center">
                  <button className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">badge</span>
                    <span>SSO Institucional / Carnet Virtual</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-space-lg mt-space-md text-center lg:text-left">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                ¿No tienes cuenta institucional?{' '}
                <Link className="font-label-md text-label-md text-secondary hover:underline font-semibold ml-1" to="/registro">
                  Regístrate para solicitar acceso a la biblioteca
                </Link>
              </p>
            </div>
          </div>

          {/* Columna Derecha: Panel Editorial */}
          <div className="lg:col-span-6 xl:col-span-5 relative bg-gradient-to-br from-primary via-primary-container to-secondary flex flex-col justify-between p-space-lg sm:p-space-xl lg:p-12 text-on-primary">
            <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-surface-container-lowest/10 backdrop-blur-sm p-space-md">
              <div className="w-full h-44 rounded-lg shadow-inner opacity-90 flex items-center justify-center bg-primary-container">
                <span className="material-symbols-outlined text-6xl text-on-primary-container opacity-60">local_library</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-on-primary/80">
                <span className="font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">auto_stories</span> Colecciones Especiales
                </span>
                <span className="font-label-sm text-label-sm opacity-60">Catálogo General 2025</span>
              </div>
            </div>

            <div className="my-space-xl relative z-10 space-y-space-md pl-4 border-l-2 border-secondary-container">
              <p className="font-headline-sm text-headline-sm italic leading-relaxed text-surface-bright">
                «De los diversos instrumentos inventados por el hombre, el más asombroso es el libro; todos los demás
                son extensiones de su cuerpo... Sólo el libro es una extensión de la imaginación y de la memoria.»
              </p>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-0.5 bg-secondary-fixed"></span>
                <span className="font-title-md text-title-md text-surface-variant font-medium tracking-wide">
                  Jorge Luis Borges
                </span>
              </div>
            </div>

            <div className="relative z-10 rounded-lg p-space-md bg-surface-container-lowest/10 backdrop-blur-md">
              <div className="flex items-start space-x-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl mt-0.5 select-none">
                  assured_workload
                </span>
                <div className="space-y-0.5">
                  <span className="font-title-md font-semibold text-surface-bright block">Biblioteca Central</span>
                  <span className="font-body-sm text-body-sm text-surface-variant block">
                    Servicio de Préstamo e Investigación Digital
                  </span>
                  <span className="font-label-sm text-label-sm text-surface-dim/70 block pt-1">
                    Consultas técnicas: soporte.biblioteca@institucion.edu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login
