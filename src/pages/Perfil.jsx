import { useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

function Perfil() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cambiar = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.')
      return
    }
    setSaving(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setSuccess('Contraseña actualizada. Las demás sesiones abiertas se cerraron.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-3xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Cuenta institucional
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Mi perfil</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Consulta tus datos y cambia tu contraseña de acceso al portal.
        </p>
      </header>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 shadow-sm p-4 sm:p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-lg font-bold uppercase shrink-0">
          {user?.nombre?.substring(0, 2) || 'US'}
        </div>
        <div className="min-w-0">
          <h2 className="font-title-md font-serif font-bold text-on-surface truncate">{user?.nombre}</h2>
          <p className="text-xs text-on-surface-variant truncate">{user?.correo}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-semibold">
            {user?.rol}
          </span>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 shadow-sm p-4 sm:p-6">
        <h2 className="font-title-md font-bold text-on-surface mb-1">Cambiar contraseña</h2>
        <p className="text-xs text-on-surface-variant mb-4">
          Mínimo 8 caracteres. Se guarda con hash; nadie puede leerla desde la base.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-900 border border-green-200 text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {success}
          </div>
        )}

        <form onSubmit={cambiar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface" htmlFor="current-password">
              Contraseña actual
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface" htmlFor="new-password">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface" htmlFor="confirm-password">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="min-h-[44px] px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-4 rounded-lg bg-secondary text-on-secondary text-xs font-bold disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Perfil
