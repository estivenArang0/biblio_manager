import PanelBibliotecario from '../components/PanelBibliotecario'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookCard from '../components/BookCard'
import { catalogBooks as initialBooks, catalogFilters } from '../data/catalogBooks'

function Catalogo() {
  const [searchParams] = useSearchParams()

  const [books, setBooks] = useState(() => {
    try {
      const guardados = localStorage.getItem('catalogo_libros_agregados')
      return guardados ? JSON.parse(guardados) : initialBooks
    } catch {
      return initialBooks
    }
  })

  // Filtros
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [author, setAuthor] = useState('')
  const [availability, setAvailability] = useState('')
  const [language, setLanguage] = useState('')
  const [period, setPeriod] = useState('')

  // Sincronización con el buscador global de la barra superior (Header)
  useEffect(() => {
    const query = searchParams.get('q')
    if (query !== null) {
      setSearch(query)
      setCurrentPage(1)
    }
  }, [searchParams])

  // Estado para Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Estado para Modal "Agregar libro" (Bibliotecario)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: 'Literatura Clásica',
    isbn: '',
    signature: '',
    format: 'Digital',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
  })

  // Estado para Modal "Editar libro" (Bibliotecario)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState(null)

  // Rol del usuario activo
  const usuarioActual = JSON.parse(localStorage.getItem('usuario_biblio') || '{}')
  const esBibliotecario = usuarioActual.rol === 'Bibliotecario'

  const resetFilters = () => {
    setSearch('')
    setGenre('')
    setAuthor('')
    setAvailability('')
    setLanguage('')
    setPeriod('')
    setCurrentPage(1)
  }

  // Generación dinámica de géneros a partir de todos los libros registrados
  const dynamicGenres = useMemo(() => {
    const genresSet = new Set()

    books.forEach((b) => {
      if (b.genre && typeof b.genre === 'string') genresSet.add(b.genre.trim())
      if (b.tag && typeof b.tag === 'string') genresSet.add(b.tag.trim())
    })

    if (Array.isArray(catalogFilters?.genres)) {
      catalogFilters.genres.forEach((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value || opt.label
        if (val) genresSet.add(val.trim())
      })
    }

    return Array.from(genresSet)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((g) => ({ value: g, label: g }))
  }, [books])

  // Filtrado de libros en tiempo real con TODOS los filtros funcionales
  const filteredBooks = useMemo(() => {
    const normalizar = (txt) =>
      (txt || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    return books.filter((book) => {
      // 1. Buscador textual
      const term = normalizar(search)
      const bookTitle = normalizar(book.title)
      const bookAuthor = normalizar(book.author)
      const bookIsbn = normalizar(book.isbn)
      const bookSig = normalizar(book.signature || book.signatura)

      const matchSearch =
        term === '' ||
        bookTitle.includes(term) ||
        bookAuthor.includes(term) ||
        bookIsbn.includes(term) ||
        bookSig.includes(term)

      // 2. Filtro Género / Materia
      const normGenre = normalizar(genre)
      const matchGenre =
        normGenre === '' ||
        normalizar(book.tag).includes(normGenre) ||
        normalizar(book.genre).includes(normGenre)

      // 3. Filtro Autor de Referencia
      const normAuthor = normalizar(author)
      const matchAuthor =
        normAuthor === '' ||
        bookAuthor.includes(normAuthor) ||
        normAuthor.includes(bookAuthor) ||
        normAuthor
          .split(' ')
          .filter((p) => p.length > 3)
          .some((palabra) => bookAuthor.includes(palabra))

      // 4. Filtro Disponibilidad inteligente
      const normAvail = normalizar(availability)
      let matchAvail = normAvail === ''

      if (!matchAvail) {
        const bookAvailStr = normalizar(book.availability || (book.available ? 'disponible' : 'prestado'))
        const bookFormat = normalizar(book.format || '')

        if (normAvail.includes('disponible') || normAvail === 'available') {
          matchAvail = bookAvailStr.includes('disponible') || book.available === true
        } else if (normAvail.includes('prestado') || normAvail.includes('revision') || normAvail === 'loaned') {
          matchAvail = bookAvailStr.includes('prestado') || bookAvailStr.includes('revision') || book.available === false
        } else if (normAvail.includes('digital')) {
          matchAvail = bookFormat.includes('digital') || bookAvailStr.includes('digital')
        } else if (normAvail.includes('sala') || normAvail.includes('fisico')) {
          matchAvail = bookFormat.includes('fisico') || bookFormat.includes('sala') || bookAvailStr.includes('sala')
        } else {
          matchAvail = bookAvailStr.includes(normAvail) || normAvail.includes(bookAvailStr)
        }
      }

      // 5. Filtro Idioma de Edición
      const normLang = normalizar(language)
      const bookLang = normalizar(book.language || book.idioma || 'Espanol')
      const matchLanguage =
        normLang === '' ||
        bookLang.includes(normLang) ||
        normLang.includes(bookLang) ||
        (normLang.includes('espanol') && bookLang === '')

      // 6. Filtro Periodo Histórico inteligente
      const normPeriod = normalizar(period)
      let matchPeriod = normPeriod === ''

      if (!matchPeriod) {
        const bookPeriod = normalizar(book.period || book.periodo || '')
        const anio = parseInt(book.year || '0', 10)

        if (bookPeriod && (bookPeriod.includes(normPeriod) || normPeriod.includes(bookPeriod))) {
          matchPeriod = true
        } else if (
          normPeriod.includes('oro') ||
          normPeriod.includes('clasico') ||
          normPeriod.includes('renacimiento') ||
          normPeriod.includes('xvi') ||
          normPeriod.includes('xvii')
        ) {
          matchPeriod = (anio > 0 && anio < 1800) || bookAuthor.includes('cervantes')
        } else if (normPeriod.includes('xix') || normPeriod.includes('romanticismo') || normPeriod.includes('realismo')) {
          matchPeriod = anio >= 1800 && anio < 1900
        } else if (
          normPeriod.includes('xx') ||
          normPeriod.includes('moderno') ||
          normPeriod.includes('boom') ||
          normPeriod.includes('vanguardia')
        ) {
          matchPeriod =
            (anio >= 1900 && anio < 2000) ||
            bookAuthor.includes('borges') ||
            bookAuthor.includes('garcia marquez') ||
            bookAuthor.includes('cortazar') ||
            bookAuthor.includes('rulfo')
        } else if (normPeriod.includes('xxi') || normPeriod.includes('contemporaneo') || normPeriod.includes('actual')) {
          matchPeriod = anio >= 2000
        }
      }

      return matchSearch && matchGenre && matchAuthor && matchAvail && matchLanguage && matchPeriod
    })
  }, [books, search, genre, author, availability, language, period])

  // Cálculo de Paginación interactiva
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredBooks, currentPage, itemsPerPage])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 1. Manejador para agregar nuevo libro
  const handleAddBook = (e) => {
    e.preventDefault()
    if (!newBook.title.trim() || !newBook.author.trim()) return

    const nuevo = {
      id: Date.now().toString(),
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      tag: newBook.genre,
      genre: newBook.genre,
      isbn: newBook.isbn.trim() || `978-958-${Math.floor(1000 + Math.random() * 9000)}-01`,
      signature: newBook.signature.trim() || `BIB-${Math.floor(100 + Math.random() * 900)}-E`,
      format: newBook.format,
      availability: 'Disponible',
      availabilityTone: 'positive',
      year: new Date().getFullYear().toString(),
      language: 'Español',
      period: 'Contemporáneo',
      image: newBook.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    }

    const catalogoActualizado = [nuevo, ...books]
    setBooks(catalogoActualizado)
    localStorage.setItem('catalogo_libros_agregados', JSON.stringify(catalogoActualizado))

    setIsModalOpen(false)
    setNewBook({
      title: '',
      author: '',
      genre: 'Literatura Clásica',
      isbn: '',
      signature: '',
      format: 'Digital',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    })
    setCurrentPage(1)
  }

  // 2. Abrir modal para editar
  const handleOpenEditModal = (book) => {
    setBookToEdit({
      id: book.id,
      title: book.title || '',
      author: book.author || '',
      genre: book.genre || book.tag || 'Literatura Clásica',
      isbn: book.isbn || '',
      signature: book.signature || book.signatura || '',
      format: book.format || 'Digital',
      image: book.image || '',
    })
    setIsEditModalOpen(true)
  }

  // 3. Guardar cambios del libro editado
  const handleSaveEditBook = (e) => {
    e.preventDefault()
    if (!bookToEdit || !bookToEdit.title.trim() || !bookToEdit.author.trim()) return

    const catalogoActualizado = books.map((b) => {
      if (b.id === bookToEdit.id) {
        return {
          ...b,
          title: bookToEdit.title.trim(),
          author: bookToEdit.author.trim(),
          tag: bookToEdit.genre.trim(),
          genre: bookToEdit.genre.trim(),
          isbn: bookToEdit.isbn.trim(),
          signature: bookToEdit.signature.trim(),
          format: bookToEdit.format,
          image: bookToEdit.image || b.image,
        }
      }
      return b
    })

    setBooks(catalogoActualizado)
    localStorage.setItem('catalogo_libros_agregados', JSON.stringify(catalogoActualizado))
    window.dispatchEvent(new Event('storage'))

    setIsEditModalOpen(false)
    setBookToEdit(null)
  }

  return (
    <div className="w-full px-gutter py-space-lg flex flex-col gap-space-lg max-w-[1520px] mx-auto select-none">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
              Acervo Académico
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm tracking-wide">Fondo General & Repositorio Digital</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">Catálogo de Libros</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            Exploración y reserva bibliográfica del fondo general, colecciones de acceso restringido y recursos de
            consulta electrónica.
          </p>
        </div>

        {/* Solo el Bibliotecario ve y usa el botón de Agregar libro */}
        {esBibliotecario && (
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-title-md">add</span>
              <span>Agregar libro</span>
            </button>
          </div>
        )}
      </header>

      {/* Filtros */}
      <section aria-label="Filtros del catálogo" className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md border border-outline-variant/20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
          <div className="md:col-span-8 relative flex items-center">
            <span className="material-symbols-outlined absolute left-space-md text-on-surface-variant text-body-lg pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-colors"
              placeholder="Buscar por signatura, materia, descriptor o ISBN..."
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end gap-space-sm">
            <div className="flex items-center gap-2 px-space-sm py-2 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm w-full md:w-auto justify-between border border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-body-md text-secondary">verified</span>
                <span>Ediciones autenticadas</span>
              </div>
              <span className="text-on-surface-variant/50 font-mono text-[10px]">ISO-2709</span>
            </div>
            <button
              className="inline-flex items-center gap-1 px-3 py-2 text-on-surface-variant hover:text-secondary font-label-sm text-label-sm transition-colors whitespace-nowrap cursor-pointer"
              onClick={resetFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-body-sm">restart_alt</span>
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm pt-space-xs">
          <FilterSelect
            label="Género & Materia"
            value={genre}
            onChange={(v) => { setGenre(v); setCurrentPage(1); }}
            options={dynamicGenres}
            placeholder="Todos los géneros"
          />
          <FilterSelect
            label="Autor de Referencia"
            value={author}
            onChange={(v) => { setAuthor(v); setCurrentPage(1); }}
            options={catalogFilters.authors || []}
            placeholder="Todos los autores"
          />
          <FilterSelect
            label="Disponibilidad"
            value={availability}
            onChange={(v) => { setAvailability(v); setCurrentPage(1); }}
            options={catalogFilters.availability || []}
            placeholder="Cualquier estado"
          />
          <FilterSelect
            label="Idioma de Edición"
            value={language}
            onChange={(v) => { setLanguage(v); setCurrentPage(1); }}
            options={catalogFilters.languages || []}
            placeholder="Todos los idiomas"
          />
          <FilterSelect
            label="Periodo Histórico"
            value={period}
            onChange={(v) => { setPeriod(v); setCurrentPage(1); }}
            options={catalogFilters.periods || []}
            placeholder="Todos los periodos"
          />
        </div>
      </section>

      {/* Bandeja de Aprobación de Préstamos (Exclusivo Bibliotecario) */}
      {esBibliotecario && <PanelBibliotecario />}

      {/* Contador y orden */}
      <section className="flex items-center justify-between gap-space-md py-space-xs">
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            Mostrando {paginatedBooks.length} de {filteredBooks.length} obras catalogadas
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
            PÁGINA {currentPage} DE {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mr-2">
            <span>Ordenar:</span>
            <select className="bg-transparent font-label-md text-label-md text-on-surface font-medium focus:outline-none cursor-pointer">
              <option>Relevancia académica</option>
              <option>Año: más reciente</option>
              <option>Signatura A-Z</option>
              <option>Calificación de cátedra</option>
            </select>
          </div>
          <div className="flex items-center p-1 bg-surface-container-low rounded-lg shadow-sm">
            <button aria-label="Vista cuadrícula" className="p-1.5 rounded-md bg-surface-container-lowest text-on-surface shadow-xs" type="button">
              <span className="material-symbols-outlined text-body-lg leading-none">grid_view</span>
            </button>
            <button aria-label="Vista lista" className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-body-lg leading-none">view_list</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grilla de libros paginada con prop onEdit */}
      <section aria-label="Catálogo de libros disponibles" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-lg min-h-[400px]">
        {paginatedBooks.length > 0 ? (
          paginatedBooks.map((book) => (
            <BookCard key={book.id} book={book} onEdit={handleOpenEditModal} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl mb-2 text-secondary">menu_book</span>
            <p className="font-headline-sm text-on-surface font-semibold">No se encontraron libros con los criterios seleccionados.</p>
            <p className="font-body-sm text-on-surface-variant mt-1">Prueba limpiando los filtros o seleccionando otros parámetros.</p>
          </div>
        )}
      </section>

      {/* Paginación Interactiva Funcional */}
      <footer aria-label="Navegación de páginas" className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-sm border border-outline-variant/20">
        <div className="flex items-center gap-space-sm text-on-surface-variant">
          <label className="font-body-sm text-body-sm" htmlFor="items-per-page">
            Mostrar:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="bg-surface-container-low text-on-surface font-label-md text-label-md px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="4">4 obras por página</option>
            <option value="8">8 obras por página</option>
            <option value="12">12 obras por página</option>
            <option value="24">24 obras por página</option>
          </select>
          <span className="hidden sm:inline font-body-sm text-body-sm text-on-surface-variant/60 ml-2">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <nav aria-label="Paginador" className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
              currentPage === 1
                ? 'text-on-surface-variant/40 cursor-not-allowed bg-surface-container-low/40'
                : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-body-md">chevron_left</span>
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1 mx-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                onClick={() => handlePageChange(num)}
                aria-current={currentPage === num ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg font-label-md text-label-md flex items-center justify-center font-medium transition-all cursor-pointer ${
                  currentPage === num
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
                type="button"
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
              currentPage === totalPages
                ? 'text-on-surface-variant/40 cursor-not-allowed bg-surface-container-low/40'
                : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
            }`}
            type="button"
          >
            <span>Siguiente</span>
            <span className="material-symbols-outlined text-body-md">chevron_right</span>
          </button>
        </nav>
      </footer>

      {/* MODAL 1: REGISTRAR NUEVO LIBRO (BIBLIOTECARIO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">library_add</span>
                <h2 className="font-title-lg text-on-surface font-bold">Registrar Nueva Obra en Acervo</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Título de la Obra *</label>
                <input
                  required
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Ej. Rayuela o Pedro Páramo"
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Autor *</label>
                  <input
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="Ej. Julio Cortázar"
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Género / Materia</label>
                  <input
                    value={newBook.genre}
                    onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                    placeholder="Ej. Literatura Clásica"
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Signatura Topográfica</label>
                  <input
                    value={newBook.signature}
                    onChange={(e) => setNewBook({ ...newBook, signature: e.target.value })}
                    placeholder="Ej. LIT-COR-01"
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Formato</label>
                  <select
                    value={newBook.format}
                    onChange={(e) => setNewBook({ ...newBook, format: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Digital">Digital (PDF / ePub)</option>
                    <option value="Físico">Físico (Ejemplar en Sala)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">URL de Imagen de Portada</label>
                <input
                  value={newBook.image}
                  onChange={(e) => setNewBook({ ...newBook, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-xs font-mono rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Guardar en Acervo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR OBRA EXISTENTE (BIBLIOTECARIO) */}
      {isEditModalOpen && bookToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit_note</span>
                <h2 className="font-title-lg text-on-surface font-bold">Editar Ficha de la Obra</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setBookToEdit(null)
                }}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditBook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Título de la Obra *</label>
                <input
                  required
                  value={bookToEdit.title}
                  onChange={(e) => setBookToEdit({ ...bookToEdit, title: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Autor *</label>
                  <input
                    required
                    value={bookToEdit.author}
                    onChange={(e) => setBookToEdit({ ...bookToEdit, author: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Género / Materia</label>
                  <input
                    value={bookToEdit.genre}
                    onChange={(e) => setBookToEdit({ ...bookToEdit, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Signatura Topográfica</label>
                  <input
                    value={bookToEdit.signature}
                    onChange={(e) => setBookToEdit({ ...bookToEdit, signature: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Formato</label>
                  <select
                    value={bookToEdit.format}
                    onChange={(e) => setBookToEdit({ ...bookToEdit, format: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-sm rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Digital">Digital (PDF / ePub)</option>
                    <option value="Físico">Físico (Ejemplar en Sala)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">URL de Imagen de Portada</label>
                <input
                  value={bookToEdit.image}
                  onChange={(e) => setBookToEdit({ ...bookToEdit, image: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-xs font-mono rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setBookToEdit(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Actualizar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">{label}</label>
      <div className="relative">
        <select
          className="w-full appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm px-space-sm py-2 rounded-lg pr-7 focus:outline-none cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const optVal = opt.value !== undefined ? opt.value : opt
            const optLabel = opt.label !== undefined ? opt.label : opt
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            )
          })}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-2.5 text-body-sm text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  )
}

export default Catalogo