import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookCard from '../components/BookCard'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { catalogFilters } from '../data/catalogBooks'
import { normalizarTexto as normalizar } from '../utils/text'

const STAFF = ['Bibliotecario', 'Administrador']
const IMAGEN_POR_DEFECTO =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'

const libroVacio = {
  title: '',
  author: '',
  genre: 'Literatura Clásica',
  isbn: '',
  signature: '',
  format: 'Digital',
  image: IMAGEN_POR_DEFECTO,
  description: '',
}

function Catalogo() {
  const { user } = useAuth()
  const esStaff = STAFF.includes(user?.rol)

  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [requestingId, setRequestingId] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const search = searchParams.get('q') ?? ''
  const setSearch = (valor) => {
    const params = new URLSearchParams(searchParams)
    if (valor) params.set('q', valor)
    else params.delete('q')
    setSearchParams(params, { replace: true })
    setCurrentPage(1)
  }

  const [genre, setGenre] = useState('')
  const [author, setAuthor] = useState('')
  const [availability, setAvailability] = useState('')
  const [language, setLanguage] = useState('')
  const [period, setPeriod] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBook, setNewBook] = useState(libroVacio)
  const [savingBook, setSavingBook] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState(null)

  const cargarLibros = useCallback(async () => {
    try {
      const data = await api.books()
      setBooks(data.books)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de datos remotos
    cargarLibros()
  }, [cargarLibros])

  const resetFilters = () => {
    setSearch('')
    setGenre('')
    setAuthor('')
    setAvailability('')
    setLanguage('')
    setPeriod('')
    setCurrentPage(1)
  }

  const dynamicGenres = useMemo(() => {
    const genres = new Set()
    books.forEach((book) => {
      if (book.genre) genres.add(book.genre.trim())
      if (book.tag) genres.add(book.tag.trim())
    })
    ;(catalogFilters?.genres || []).forEach((option) => {
      const value = typeof option === 'string' ? option : option.value || option.label
      if (value) genres.add(value.trim())
    })
    return Array.from(genres)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((value) => ({ value, label: value }))
  }, [books])

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const term = normalizar(search)
      const matchSearch =
        term === '' ||
        normalizar(book.title).includes(term) ||
        normalizar(book.author).includes(term) ||
        normalizar(book.isbn).includes(term) ||
        normalizar(book.signature).includes(term)

      const normGenre = normalizar(genre)
      const matchGenre =
        normGenre === '' || normalizar(book.tag).includes(normGenre) || normalizar(book.genre).includes(normGenre)

      const normAuthor = normalizar(author)
      const bookAuthor = normalizar(book.author)
      const matchAuthor =
        normAuthor === '' ||
        bookAuthor.includes(normAuthor) ||
        normAuthor.includes(bookAuthor) ||
        normAuthor
          .split(' ')
          .filter((part) => part.length > 3)
          .some((word) => bookAuthor.includes(word))

      const normAvail = normalizar(availability)
      let matchAvail = normAvail === ''
      if (!matchAvail) {
        if (normAvail.includes('digital')) matchAvail = Boolean(book.digital)
        else if (normAvail.includes('sala') || normAvail.includes('fisico')) matchAvail = Boolean(book.physical)
        else if (normAvail.includes('prestado') || normAvail.includes('revision')) matchAvail = false
        else matchAvail = true
      }

      const normLang = normalizar(language)
      const bookLang = normalizar(book.language || 'Español')
      const matchLanguage = normLang === '' || bookLang.includes(normLang) || normLang.includes(bookLang)

      const normPeriod = normalizar(period)
      let matchPeriod = normPeriod === ''
      if (!matchPeriod) {
        const year = parseInt(book.year || '0', 10)
        if (normPeriod.includes('clasico')) matchPeriod = year > 0 && year < 1900
        else if (normPeriod.includes('siglo-xx') || normPeriod.includes('xx')) matchPeriod = year >= 1900 && year < 2000
        else if (normPeriod.includes('contemporaneo')) matchPeriod = year >= 2000
        else matchPeriod = true
      }

      return matchSearch && matchGenre && matchAuthor && matchAvail && matchLanguage && matchPeriod
    })
  }, [books, search, genre, author, availability, language, period])

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredBooks.slice(start, start + itemsPerPage)
  }, [filteredBooks, currentPage, itemsPerPage])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleRequest = async (book) => {
    setRequestingId(book.id)
    setFeedback(null)
    try {
      await api.requestLoan(book.id)
      await cargarLibros()
      setFeedback({
        type: 'ok',
        text: `Solicitud enviada para "${book.title}". El bibliotecario la revisará pronto.`,
      })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo enviar la solicitud.' })
    } finally {
      setRequestingId(null)
    }
  }

  const handleAddBook = async (event) => {
    event.preventDefault()
    if (!newBook.title.trim() || !newBook.author.trim()) return
    setSavingBook(true)
    setFeedback(null)
    try {
      await api.createBook({
        ...newBook,
        year: new Date().getFullYear().toString(),
      })
      await cargarLibros()
      setIsModalOpen(false)
      setNewBook(libroVacio)
      setCurrentPage(1)
      setFeedback({ type: 'ok', text: 'Obra registrada en el acervo.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo registrar la obra.' })
    } finally {
      setSavingBook(false)
    }
  }

  const handleOpenEditModal = (book) => {
    setBookToEdit({
      id: book.id,
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || book.tag || 'Literatura Clásica',
      isbn: book.isbn || '',
      signature: book.signature || '',
      format: book.format || 'Digital',
      image: book.image || '',
      description: book.description || '',
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEditBook = async (event) => {
    event.preventDefault()
    if (!bookToEdit?.title.trim() || !bookToEdit?.author.trim()) return
    setSavingBook(true)
    setFeedback(null)
    try {
      await api.updateBook(bookToEdit.id, bookToEdit)
      await cargarLibros()
      setIsEditModalOpen(false)
      setBookToEdit(null)
      setFeedback({ type: 'ok', text: 'Ficha actualizada correctamente.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo actualizar la ficha.' })
    } finally {
      setSavingBook(false)
    }
  }

  if (loading && books.length === 0) {
    return <LoadingScreen label="Cargando catálogo…" />
  }

  return (
    <div className="w-full px-3 sm:px-gutter py-space-lg flex flex-col gap-space-lg max-w-[1520px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant flex-wrap">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
              Acervo Académico
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm tracking-wide">Fondo General & Repositorio Digital</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
            Catálogo de libros
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            Exploración y solicitud de préstamo del fondo general, colecciones de acceso restringido y recursos
            de consulta electrónica.
          </p>
        </div>

        {esStaff && (
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-space-xs min-h-[44px] px-space-md py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-title-md">add</span>
              <span>Agregar libro</span>
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={cargarLibros} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded-lg text-body-sm flex items-start gap-2 border ${
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
            aria-label="Cerrar aviso"
            onClick={() => setFeedback(null)}
            className="w-11 h-11 -my-2 -mr-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      <section
        aria-label="Filtros del catálogo"
        className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md border border-outline-variant/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
          <div className="md:col-span-8 relative flex items-center">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant text-body-lg pointer-events-none">
              search
            </span>
            <input
              className="w-full min-h-[44px] pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-colors"
              placeholder="Buscar por signatura, materia, descriptor o ISBN…"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end gap-space-sm flex-wrap">
            <div className="flex items-center gap-2 px-space-sm py-2 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm w-full md:w-auto justify-between border border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-body-md text-secondary">verified</span>
                <span>Ediciones autenticadas</span>
              </div>
              <span className="text-on-surface-variant/50 font-mono text-[10px]">ISO-2709</span>
            </div>
            <button
              className="inline-flex items-center gap-1 px-3 min-h-[44px] text-on-surface-variant hover:text-secondary font-label-sm text-label-sm transition-colors whitespace-nowrap cursor-pointer"
              onClick={resetFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-body-sm">restart_alt</span>
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm pt-space-xs">
          <FilterSelect
            label="Género & Materia"
            value={genre}
            onChange={(value) => {
              setGenre(value)
              setCurrentPage(1)
            }}
            options={dynamicGenres}
            placeholder="Todos los géneros"
          />
          <FilterSelect
            label="Autor de referencia"
            value={author}
            onChange={(value) => {
              setAuthor(value)
              setCurrentPage(1)
            }}
            options={catalogFilters.authors || []}
            placeholder="Todos los autores"
          />
          <FilterSelect
            label="Disponibilidad"
            value={availability}
            onChange={(value) => {
              setAvailability(value)
              setCurrentPage(1)
            }}
            options={catalogFilters.availability || []}
            placeholder="Cualquier estado"
          />
          <FilterSelect
            label="Idioma de edición"
            value={language}
            onChange={(value) => {
              setLanguage(value)
              setCurrentPage(1)
            }}
            options={catalogFilters.languages || []}
            placeholder="Todos los idiomas"
          />
          <FilterSelect
            label="Periodo histórico"
            value={period}
            onChange={(value) => {
              setPeriod(value)
              setCurrentPage(1)
            }}
            options={catalogFilters.periods || []}
            placeholder="Todos los periodos"
          />
        </div>
      </section>

      <section className="flex items-center justify-between gap-space-md py-space-xs flex-wrap">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            Mostrando {paginatedBooks.length} de {filteredBooks.length} obras
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
            PÁGINA {currentPage} DE {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center p-1 bg-surface-container-low rounded-lg shadow-sm">
            <span className="px-2 py-1.5 rounded-md bg-surface-container-lowest text-on-surface shadow-xs flex items-center">
              <span className="material-symbols-outlined text-body-lg leading-none">grid_view</span>
            </span>
            <span className="px-2 py-1.5 rounded-md text-on-surface-variant flex items-center">
              <span className="material-symbols-outlined text-body-lg leading-none">view_list</span>
            </span>
          </div>
        </div>
      </section>

      <section
        aria-label="Catálogo de libros"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-lg min-h-[400px]"
      >
        {paginatedBooks.length > 0 ? (
          paginatedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleOpenEditModal}
              onRequest={handleRequest}
              requesting={requestingId === book.id}
              esStaff={esStaff}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl mb-2 text-secondary">menu_book</span>
            <p className="font-headline-sm text-on-surface font-semibold">
              No se encontraron libros con los criterios seleccionados.
            </p>
            <p className="font-body-sm text-on-surface-variant mt-1">Prueba limpiando los filtros.</p>
          </div>
        )}
      </section>

      <footer
        aria-label="Navegación de páginas"
        className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-sm border border-outline-variant/20"
      >
        <div className="flex items-center gap-space-sm text-on-surface-variant flex-wrap justify-center">
          <label className="font-body-sm text-body-sm" htmlFor="items-per-page">
            Mostrar:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(event) => {
              setItemsPerPage(Number(event.target.value))
              setCurrentPage(1)
            }}
            className="bg-surface-container-low text-on-surface font-label-md text-label-md px-2.5 min-h-[44px] rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="4">4 por página</option>
            <option value="8">8 por página</option>
            <option value="12">12 por página</option>
            <option value="24">24 por página</option>
          </select>
        </div>

        <nav aria-label="Paginador" className="flex items-center gap-1 max-w-full overflow-x-auto">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`inline-flex items-center justify-center gap-1 px-2 sm:px-3 min-w-[44px] min-h-[44px] rounded-lg font-label-md text-label-md transition-colors ${
              currentPage === 1
                ? 'text-on-surface-variant/40 cursor-not-allowed bg-surface-container-low/40'
                : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-body-md">chevron_left</span>
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1 mx-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                aria-current={currentPage === number ? 'page' : undefined}
                className={`w-11 h-11 rounded-lg font-label-md text-label-md flex items-center justify-center font-medium transition-all cursor-pointer ${
                  currentPage === number
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
                type="button"
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center justify-center gap-1 px-2 sm:px-3 min-w-[44px] min-h-[44px] rounded-lg font-label-md text-label-md transition-colors ${
              currentPage === totalPages
                ? 'text-on-surface-variant/40 cursor-not-allowed bg-surface-container-low/40'
                : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
            }`}
            type="button"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <span className="material-symbols-outlined text-body-md">chevron_right</span>
          </button>
        </nav>
      </footer>

      {isModalOpen && (
        <BookModal
          title="Registrar nueva obra"
          icon="library_add"
          book={newBook}
          setBook={setNewBook}
          onSubmit={handleAddBook}
          onClose={() => setIsModalOpen(false)}
          saving={savingBook}
          submitLabel="Guardar en acervo"
        />
      )}

      {isEditModalOpen && bookToEdit && (
        <BookModal
          title="Editar ficha de la obra"
          icon="edit_note"
          book={bookToEdit}
          setBook={setBookToEdit}
          onSubmit={handleSaveEditBook}
          onClose={() => {
            setIsEditModalOpen(false)
            setBookToEdit(null)
          }}
          saving={savingBook}
          submitLabel="Actualizar cambios"
        />
      )}
    </div>
  )
}

function BookModal({ title, icon, book, setBook, onSubmit, onClose, saving, submitLabel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-secondary">{icon}</span>
            <h2 className="font-title-lg text-on-surface font-bold truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-title">
              Título de la obra *
            </label>
            <input
              id="book-title"
              required
              value={book.title}
              onChange={(event) => setBook({ ...book, title: event.target.value })}
              placeholder="Ej. Rayuela o Pedro Páramo"
              className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-author">
                Autor *
              </label>
              <input
                id="book-author"
                required
                value={book.author}
                onChange={(event) => setBook({ ...book, author: event.target.value })}
                placeholder="Ej. Julio Cortázar"
                className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-genre">
                Género / Materia
              </label>
              <input
                id="book-genre"
                value={book.genre}
                onChange={(event) => setBook({ ...book, genre: event.target.value })}
                placeholder="Ej. Literatura Clásica"
                className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-signature">
                Signatura topográfica
              </label>
              <input
                id="book-signature"
                value={book.signature}
                onChange={(event) => setBook({ ...book, signature: event.target.value })}
                placeholder="Ej. LIT-COR-01"
                className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-format">
                Formato
              </label>
              <select
                id="book-format"
                value={book.format}
                onChange={(event) => setBook({ ...book, format: event.target.value })}
                className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="Digital">Digital (PDF / ePub)</option>
                <option value="Físico">Físico (retiro en biblioteca)</option>
                <option value="Digital y físico">Digital y físico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-isbn">
              ISBN
            </label>
            <input
              id="book-isbn"
              value={book.isbn}
              onChange={(event) => setBook({ ...book, isbn: event.target.value })}
              placeholder="978-..."
              className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-image">
              URL de la portada
            </label>
            <input
              id="book-image"
              value={book.image}
              onChange={(event) => setBook({ ...book, image: event.target.value })}
              placeholder="https://…"
              className="w-full min-h-[44px] px-3 py-2 bg-surface-container-low text-on-surface text-xs font-mono rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1" htmlFor="book-description">
              Descripción breve
            </label>
            <textarea
              id="book-description"
              rows={2}
              value={book.description}
              onChange={(event) => setBook({ ...book, description: event.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{saving ? 'Guardando…' : submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">{label}</label>
      <div className="relative">
        <select
          className="w-full min-h-[44px] appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm px-space-sm py-2 rounded-lg pr-7 focus:outline-none cursor-pointer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const optionValue = option.value !== undefined ? option.value : option
            const optionLabel = option.label !== undefined ? option.label : option
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            )
          })}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-3 text-body-sm text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  )
}

export default Catalogo
