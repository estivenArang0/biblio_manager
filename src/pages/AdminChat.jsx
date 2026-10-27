import { useCallback, useEffect, useState } from 'react'
import ChatThread from '../components/ChatThread'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function hora(value) {
  if (!value) return ''
  const date = new Date(value)
  const hoy = new Date()
  if (date.toDateString() === hoy.toDateString()) {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function AdminChat() {
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const cargarHilos = useCallback(async (silencioso = false) => {
    try {
      const data = await api.chatThreads()
      setThreads(data.threads)
    } catch (err) {
      if (!silencioso) setError(err.message || 'No se pudieron cargar las conversaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  const abrirHilo = useCallback(async (userId, silencioso = false) => {
    if (!silencioso) setLoadingThread(true)
    try {
      const data = await api.chatThread(userId)
      setThread(data)
      setSelected(userId)
      setThreads((prev) =>
        prev.map((item) => (item.user.id === userId ? { ...item, unread: 0 } : item))
      )
    } catch (err) {
      if (!silencioso) setError(err.message || 'No se pudo abrir la conversación.')
    } finally {
      if (!silencioso) setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial y polling de conversaciones
    cargarHilos()
    const interval = setInterval(() => {
      cargarHilos(true)
      if (selected) abrirHilo(selected, true)
    }, 5000)
    return () => clearInterval(interval)
  }, [cargarHilos, abrirHilo, selected])

  const enviar = async (text) => {
    if (!selected) return false
    setSending(true)
    try {
      const data = await api.sendThreadMessage(selected, text)
      setThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
      )
      return true
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje.')
      return false
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingScreen label="Cargando conversaciones…" />

  const unreadTotal = threads.reduce((total, item) => total + item.unread, 0)

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-md max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
            Atención al usuario
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
            Chat · bandeja de biblioteca
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold self-start sm:self-auto">
          <span className="material-symbols-outlined text-sm text-secondary">mark_chat_unread</span>
          {unreadTotal} sin leer
        </span>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Cerrar aviso"
            className="w-11 h-11 -my-2 -mr-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start">
        <section className={`lg:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden ${selected ? 'hidden lg:block' : ''}`}>
          <div className="px-3 py-2.5 border-b border-outline-variant/20 text-xs font-semibold text-on-surface">
            Conversaciones ({threads.length})
          </div>
          {threads.length === 0 ? (
            <p className="p-5 text-xs text-on-surface-variant text-center">No hay conversaciones todavía.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/20 max-h-[60vh] overflow-y-auto">
              {threads.map((item) => (
                <li key={item.user.id}>
                  <button
                    type="button"
                    onClick={() => abrirHilo(item.user.id)}
                    className={`w-full text-left p-3 flex items-start gap-2.5 min-h-[60px] hover:bg-surface-container-low ${
                      selected === item.user.id ? 'bg-surface-container-low' : ''
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[11px] font-bold shrink-0">
                      {item.user.nombre.substring(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-on-surface truncate">{item.user.nombre}</span>
                        <span className="text-[9px] text-on-surface-variant shrink-0">{hora(item.lastAt)}</span>
                      </span>
                      <span className="block text-[10px] text-on-surface-variant truncate">{item.user.rol}</span>
                      <span className="block text-[11px] text-on-surface-variant truncate mt-0.5">
                        {item.lastMessage}
                      </span>
                    </span>
                    {item.unread > 0 && (
                      <span className="min-w-[20px] h-5 px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {item.unread}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden min-w-0 ${selected ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="h-[52vh] flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">forum</span>
              <p className="text-sm font-semibold text-on-surface">Selecciona una conversación</p>
              <p className="text-xs mt-1 max-w-xs">
                Elige un usuario de la lista para leer y responder sus mensajes.
              </p>
            </div>
          ) : loadingThread && !thread ? (
            <LoadingScreen label="Abriendo conversación…" />
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-outline-variant/20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null)
                    setThread(null)
                  }}
                  className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-lg text-on-surface-variant"
                  aria-label="Volver a la lista"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[11px] font-bold">
                  {thread?.user.nombre.substring(0, 2) || 'US'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface truncate">{thread?.user.nombre || 'Usuario'}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {thread?.user.correo} · {thread?.user.rol}
                  </p>
                </div>
              </div>
              <ChatThread
                messages={thread?.messages || []}
                onSend={enviar}
                sending={sending}
                placeholder="Responder al usuario (máx. 500 caracteres)…"
                emptyText="Esta conversación aún no tiene mensajes."
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminChat
