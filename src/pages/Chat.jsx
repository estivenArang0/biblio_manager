import { useCallback, useEffect, useRef, useState } from 'react'
import ChatThread from '../components/ChatThread'
import LoadingScreen from '../components/LoadingScreen'
import { api } from '../services/api'

function Chat() {
  const [messages, setMessages] = useState([])
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const lastCount = useRef(0)

  const cargar = useCallback(async (silencioso = false) => {
    try {
      const data = await api.chatMessages()
      setMessages(data.messages)
      setAdmin(data.admin)
      lastCount.current = data.messages.length
      if (!silencioso) setError('')
    } catch (err) {
      if (!silencioso) setError(err.message || 'No se pudo cargar el chat.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargar()
    const interval = setInterval(() => cargar(true), 5000)
    return () => clearInterval(interval)
  }, [cargar])

  const enviar = async (text) => {
    setSending(true)
    try {
      const data = await api.sendChat(text)
      setMessages((prev) => [...prev, data.message])
      return true
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje.')
      return false
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingScreen label="Abriendo conversación…" />

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-md max-w-3xl mx-auto">
      <header className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
          Canal institucional
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
          Chat con administración
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {admin ? `Atendido por ${admin.nombre} · ${admin.correo}` : 'Escribe al administrador de la biblioteca.'}
        </p>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[11px] font-bold">
            AD
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-on-surface truncate">Administración de biblioteca</p>
            <p className="text-[10px] text-on-surface-variant">Actualización cada 5 segundos</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            En línea
          </span>
        </div>

        <ChatThread
          messages={messages}
          onSend={enviar}
          sending={sending}
          placeholder="Escribe al administrador (máx. 500 caracteres)…"
          emptyText="Aún no has escrito. Cuéntale al administrador qué necesitas."
        />
      </div>

      <p className="text-[10px] text-on-surface-variant text-center">
        Mensajes de texto plano. No compartas contraseñas ni datos sensibles.
      </p>
    </div>
  )
}

export default Chat
