import { useCallback, useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

const ROLES = ['Estudiante', 'Docente', 'Bibliotecario', 'Administrador']
const rolClase = {
  Estudiante: 'bg-blue-50 text-blue-800 border-blue-200',
  Docente: 'bg-purple-50 text-purple-800 border-purple-200',
  Bibliotecario: 'bg-amber-50 text-amber-900 border-amber-200',
  Administrador: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

function fecha(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Usuarios() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', correo: '', rol: 'Estudiante', password: '' })
  const [saving, setSaving] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const data = await api.users()
      setUsers(data.users)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  const cambiarRol = async (target, rol) => {
    if (rol === target.rol) return
    setBusy(target.id)
    setFeedback(null)
    try {
      await api.changeRole(target.id, rol)
      await cargar()
      setFeedback({ type: 'ok', text: `Rol de ${target.nombre} actualizado a ${rol}.` })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo cambiar el rol.' })
    } finally {
      setBusy(null)
    }
  }

  const crear = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await api.createUser(nuevo)
      await cargar()
      setModalOpen(false)
      setNuevo({ nombre: '', correo: '', rol: 'Estudiante', password: '' })
      setFeedback({ type: 'ok', text: 'Usuario creado correctamente.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo crear el usuario.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen label="Cargando usuarios…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
            Administración del sistema
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
            Usuarios y roles
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Crea cuentas y ajusta permisos. Los accesos se validan en el servidor en cada petición.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-sm"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Nuevo usuario
        </button>
      </header>

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
          <span className="flex-1">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Cerrar aviso"
            className="w-11 h-11 -my-2 -mr-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-3 py-2 font-semibold">Nombre</th>
                <th className="px-3 py-2 font-semibold">Correo</th>
                <th className="px-3 py-2 font-semibold">Rol</th>
                <th className="px-3 py-2 font-semibold">Préstamos activos</th>
                <th className="px-3 py-2 font-semibold">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {users.map((item) => {
                const esPropio = item.id === user?.id
                return (
                  <tr key={item.id} className="hover:bg-surface-container-low/60">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-surface-container text-on-surface flex items-center justify-center text-[10px] font-bold">
                          {item.nombre.substring(0, 2)}
                        </span>
                        <span className="font-semibold text-on-surface">{item.nombre}</span>
                        {esPropio && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            tú
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">{item.correo}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block mb-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                          rolClase[item.rol] || rolClase.Estudiante
                        }`}
                      >
                        {item.rol}
                      </span>
                      <select
                        aria-label={`Cambiar rol de ${item.nombre}`}
                        value={item.rol}
                        disabled={esPropio || busy === item.id}
                        onChange={(event) => cambiarRol(item, event.target.value)}
                        className="block min-h-[44px] px-2 rounded-lg bg-surface-container-low text-on-surface text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ROLES.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 font-mono text-on-surface">
                        <span className="material-symbols-outlined text-sm text-secondary">library_books</span>
                        {item.activeLoans}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant whitespace-nowrap">{fecha(item.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-xl bg-surface-container-low border border-outline-variant/25 p-3 text-[11px] text-on-surface-variant flex items-start gap-2">
        <span className="material-symbols-outlined text-secondary text-base">info</span>
        <p>
          No puedes cambiar tu propio rol (para evitar bloqueos) y siempre debe quedar al menos un administrador.
          Los permisos efectivos se aplican en el backend, aunque alguien escriba la URL directamente.
        </p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={crear}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl w-full max-w-md p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-title-lg font-bold text-on-surface">Nuevo usuario</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar"
                className="w-11 h-11 -mr-2 flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <label className="text-xs font-semibold text-on-surface" htmlFor="nuevo-nombre">
              Nombre completo
            </label>
            <input
              id="nuevo-nombre"
              required
              value={nuevo.nombre}
              onChange={(event) => setNuevo({ ...nuevo, nombre: event.target.value })}
              className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
            />

            <label className="text-xs font-semibold text-on-surface" htmlFor="nuevo-correo">
              Correo institucional
            </label>
            <input
              id="nuevo-correo"
              required
              type="email"
              value={nuevo.correo}
              onChange={(event) => setNuevo({ ...nuevo, correo: event.target.value })}
              className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface" htmlFor="nuevo-rol">
                  Rol
                </label>
                <select
                  id="nuevo-rol"
                  value={nuevo.rol}
                  onChange={(event) => setNuevo({ ...nuevo, rol: event.target.value })}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm cursor-pointer"
                >
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface" htmlFor="nuevo-password">
                  Contraseña
                </label>
                <input
                  id="nuevo-password"
                  required
                  minLength={6}
                  type="password"
                  value={nuevo.password}
                  onChange={(event) => setNuevo({ ...nuevo, password: event.target.value })}
                  className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] px-4 rounded-lg bg-surface-container-high text-on-surface text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-4 rounded-lg bg-secondary text-on-secondary text-xs font-bold disabled:opacity-60"
              >
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Usuarios
