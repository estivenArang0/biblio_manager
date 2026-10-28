import { useEffect, useRef, useState } from 'react'

function hora(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function ChatThread({
  messages,
  onSend,
  sending,
  placeholder = 'Escribe un mensaje…',
  emptyText = 'Todavía no hay mensajes.',
  heightClass = 'h-[52vh] lg:h-[60vh]',
  disabled = false,
}) {
  const [text, setText] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length])

  const enviar = async () => {
    const value = text.trim()
    if (!value || sending || disabled) return
    const ok = await onSend(value)
    if (ok !== false) setText('')
  }

  return (
    <div className="flex flex-col min-h-0">
      <div
        ref={listRef}
        className={`${heightClass} overflow-y-auto p-3 sm:p-4 flex flex-col gap-2.5 bg-surface-container-low/40`}
        data-testid="chat-mensajes"
      >
        {messages.length === 0 ? (
          <p className="text-center text-xs text-on-surface-variant my-auto">{emptyText}</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  message.mine
                    ? 'bg-primary text-on-primary rounded-br-sm'
                    : 'bg-surface-container-lowest text-on-surface border border-outline-variant/20 rounded-bl-sm'
                }`}
              >
                <p>{message.text}</p>
                <span
                  className={`block text-[9px] mt-1 text-right ${
                    message.mine ? 'text-on-primary/60' : 'text-on-surface-variant/70'
                  }`}
                >
                  {hora(message.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-outline-variant/25 p-2 sm:p-3 flex flex-col gap-1 bg-surface-container-lowest">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            maxLength={500}
            value={text}
            disabled={sending || disabled}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                enviar()
              }
            }}
            placeholder={placeholder}
            aria-label="Mensaje"
            className="flex-1 min-h-[44px] max-h-28 px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none resize-y disabled:opacity-60"
          />
          <button
            type="button"
            onClick={enviar}
            disabled={sending || disabled || text.trim().length === 0}
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-secondary text-on-secondary text-xs font-bold flex items-center justify-center disabled:opacity-50"
            aria-label="Enviar mensaje"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </div>
        <span className="text-[10px] text-on-surface-variant text-right">{text.length}/500</span>
      </div>
    </div>
  )
}

export default ChatThread
