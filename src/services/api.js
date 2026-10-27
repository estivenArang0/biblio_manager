/**
 * Cliente HTTP del portal.
 *
 * Todas las peticiones van al backend propio (`/api`), que es quien valida la
 * sesión y los permisos. El token se guarda en localStorage y se envía en la
 * cabecera Authorization.
 */
export const TOKEN_KEY = 'biblio_token'

export class ApiError extends Error {
  constructor(status, message, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function buildQuery(params) {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request(path, { method = 'GET', body, params, raw } = {}) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`/api${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }

  if (raw) {
    if (!response.ok) {
      let message = `Error ${response.status}`
      try {
        const data = await response.json()
        message = data.error || message
      } catch {
        /* respuesta sin JSON */
      }
      throw new ApiError(response.status, message)
    }
    return response
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.error) || `Error ${response.status}`
    if (response.status === 401 && token && path !== '/auth/login') {
      clearToken()
      window.dispatchEvent(
        new CustomEvent('biblio:session-expired', { detail: { code: data?.code || '' } })
      )
    }
    throw new ApiError(response.status, message, data)
  }
  return data
}

export const api = {
  login: (correo, password) =>
    request('/auth/login', { method: 'POST', body: { correo, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    }),

  books: () => request('/books'),
  createBook: (book) => request('/books', { method: 'POST', body: book }),
  updateBook: (id, book) => request(`/books/${encodeURIComponent(id)}`, { method: 'PUT', body: book }),
  googleBooksByIsbn: (isbn) => request(`/books/isbn/${encodeURIComponent(isbn)}`),
  bookContent: (id) => request(`/books/${encodeURIComponent(id)}/content`),
  updateBookContent: (id, blocks) =>
    request(`/books/${encodeURIComponent(id)}/content`, { method: 'PUT', body: { blocks } }),

  myLoans: () => request('/loans/mine'),
  pendingLoans: () => request('/loans/pending'),
  allLoans: (params) => request('/loans', { params }),
  loanOptions: (params) => request('/loans/direct/options', { params }),
  requestLoan: (bookId) => request('/loans', { method: 'POST', body: { bookId } }),
  createDirectLoan: (payload) => request('/loans/direct', { method: 'POST', body: payload }),
  approveLoan: (id) => request(`/loans/${id}/approve`, { method: 'PATCH' }),
  returnLoan: (id) => request(`/loans/${id}/return`, { method: 'PATCH' }),

  readingLoans: () => request('/reading/loans'),
  readingBook: (bookId) => request(`/reading/${encodeURIComponent(bookId)}`),
  readingPage: (bookId, index) =>
    request(`/reading/${encodeURIComponent(bookId)}/page/${index}`),
  readingSession: (bookId, event) =>
    request(`/reading/${encodeURIComponent(bookId)}/session`, {
      method: 'POST',
      body: { event },
    }),
  bookActivities: (bookId) => request(`/reading/${encodeURIComponent(bookId)}/activity`),
  submitActivity: (bookId, payload) =>
    request(`/reading/${encodeURIComponent(bookId)}/activity`, { method: 'POST', body: payload }),
  readingProgress: (bookId) => request(`/reading/${encodeURIComponent(bookId)}/progress`),
  saveReadingProgress: (bookId, page) =>
    request(`/reading/${encodeURIComponent(bookId)}/progress`, { method: 'POST', body: { page } }),
  comprehension: () => request('/reading/comprehension'),

  favorites: () => request('/favorites'),
  addFavorite: (bookId) => request(`/favorites/${encodeURIComponent(bookId)}`, { method: 'POST' }),
  removeFavorite: (bookId) =>
    request(`/favorites/${encodeURIComponent(bookId)}`, { method: 'DELETE' }),
  notes: () => request('/notes'),

  highlights: (bookId) => request('/highlights', { params: { bookId } }),
  createHighlight: (highlight) => request('/highlights', { method: 'POST', body: highlight }),
  updateHighlight: (id, changes) => request(`/highlights/${id}`, { method: 'PUT', body: changes }),
  deleteHighlight: (id) => request(`/highlights/${id}`, { method: 'DELETE' }),

  history: () => request('/history'),
  report: (params) => request('/reports/loans', { params }),
  reportActivities: (params) => request('/reports/activities', { params }),
  downloadReportCsv: async (params) => {
    const response = await request('/reports/loans.csv', { params, raw: true })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-prestamos-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
  downloadActivitiesCsv: async (params) => {
    const response = await request('/reports/activities.csv', { params, raw: true })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-actividades-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  users: () => request('/users'),
  createUser: (user) => request('/users', { method: 'POST', body: user }),
  setUserActive: (id, active) =>
    request(`/users/${id}/active`, { method: 'PATCH', body: { active } }),

  chatMessages: () => request('/chat/messages'),
  sendChat: (text) => request('/chat/messages', { method: 'POST', body: { text } }),
  chatUnread: () => request('/chat/unread'),
  chatThreads: () => request('/chat/threads'),
  chatThread: (userId) => request(`/chat/threads/${userId}`),
  sendThreadMessage: (userId, text) =>
    request(`/chat/threads/${userId}/messages`, { method: 'POST', body: { text } }),
  readThread: (userId) => request(`/chat/threads/${userId}/read`, { method: 'POST' }),
}
