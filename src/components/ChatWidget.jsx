import { useCallback, useEffect, useRef, useState } from 'react'
import ChatThread from './ChatThread'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'

function ChatWidget() {
  const { user } = useAuth()
  const isStaff = user?.rol === 'Bibliotecario'
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [messages, setMessages] = useState([])
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [thread, setThread] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const selectedRef = useRef(null)
  const openRef = useRef(false)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    openRef.current = open
  }, [open])

  const cargarLector = useCallback(async () => {
    try {
      const data = await api.chatMessages()
      setMessages(data.messages)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo cargar el chat.')
    }
  }, [])

  const cargarHilos = useCallback(async () => {
    try {
      const data = await api.chatThreads()
      setThreads(data.threads)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las conversaciones.')
    }
  }, [])

  const abrirHilo = useCallback(async (userId) => {
    try {
      const data = await api.chatThread(userId)
      setSelected(userId)
      setThread(data)
      setThreads((current) =>
        current.map((item) => (item.user.id === userId ? { ...item, unread: 0 } : item))
      )
    } catch (err) {
      setError(err.message || 'No se pudo abrir la conversación.')
    }
  }, [])

  const actualizarNoLeidos = useCallback(async () => {
    try {
      const data = await api.chatUnread()
      setUnread(data.unread)
    } catch {
      /* silencioso */
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    // oxlint-disable-next-line react/set-state-in-effect -- consulta inicial de no leídos
    actualizarNoLeidos()
    const interval = setInterval(actualizarNoLeidos, 5000)
    const onOpen = () => setOpen(true)
    window.addEventListener('biblio:open-chat', onOpen)
    return () => {
      clearInterval(interval)
      window.removeEventListener('biblio:open-chat', onOpen)
    }
  }, [user, actualizarNoLeidos])

  useEffect(() => {
    if (!open || !user) return undefined
    if (isStaff) {
      // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de conversaciones
      cargarHilos()
    } else {
      // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de mensajes
      cargarLector()
    }
    const interval = setInterval(() => {
      actualizarNoLeidos()
      if (!openRef.current) return
      if (isStaff) {
        cargarHilos()
        if (selectedRef.current) abrirHilo(selectedRef.current)
      } else {
        cargarLector()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [open, user, isStaff, cargarHilos, cargarLector, abrirHilo, actualizarNoLeidos])

  if (!user) return null

  const enviar = async (text) => {
    setSending(true)
    try {
      if (isStaff) {
        if (!selected) return false
        const data = await api.sendThreadMessage(selected, text)
        setThread((current) =>
          current ? { ...current, messages: [...current.messages, data.message] } : current
        )
      } else {
        const data = await api.sendChat(text)
        setMessages((current) => [...current, data.message])
      }
      return true
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje.')
      return false
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        className="fixed bottom-4 right-4 z-[60] w-14 h-14 rounded-full bg-secondary text-on-secondary shadow-xl flex items-center justify-center hover:bg-secondary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">{open ? 'close' : 'chat'}</span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-3 sm:right-4 z-[70] w-[calc(100vw-1.5rem)] max-w-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-outline-variant/20 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[11px] font-bold">
              BI
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-on-surface truncate">
                {isStaff ? 'Conversaciones' : 'Chat con biblioteca'}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {isStaff ? `${threads.length} conversaciones` : 'Actualización cada 5 s'}
              </p>
            </div>
            {isStaff && selected && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setThread(null)
                }}
                className="min-h-[44px] px-2 text-[11px] font-semibold text-secondary"
              >
                Volver
              </button>
            )}
          </div>

          {error && <p className="px-3 py-2 text-[10px] text-on-error-container bg-error-container">{error}</p>}

          {isStaff && !selected ? (
            <ul className="max-h-[52vh] overflow-y-auto divide-y divide-outline-variant/20">
              {threads.length === 0 ? (
                <li className="p-5 text-xs text-center text-on-surface-variant">Sin conversaciones.</li>
              ) : (
                threads.map((item) => (
                  <li key={item.user.id}>
                    <button
                      type="button"
                      onClick={() => abrirHilo(item.user.id)}
                      className="w-full text-left p-3 min-h-[56px] flex items-start gap-2 hover:bg-surface-container-low"
                    >
                      <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold shrink-0">
                        {item.user.nombre.substring(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-on-surface truncate">
                            {item.user.nombre}
                          </span>
                          {item.unread > 0 && (
                            <span className="min-w-[20px] h-5 px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center">
                              {item.unread}
                            </span>
                          )}
                        </span>
                        <span className="block text-[10px] text-on-surface-variant truncate">
                          {item.lastMessage}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <ChatThread
              messages={isStaff ? thread?.messages || [] : messages}
              onSend={enviar}
              sending={sending}
              placeholder={isStaff ? 'Responder al lector…' : 'Escribe al bibliotecario…'}
              emptyText={isStaff ? 'Conversación sin mensajes.' : 'Aún no has escrito.'}
              heightClass="h-[42vh]"
            />
          )}
        </div>
      )}
    </>
  )
}

export default ChatWidget
