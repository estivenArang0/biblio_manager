import { useState } from 'react'
import BookCard from '../components/BookCard'
import { catalogBooks, catalogFilters } from '../data/catalogBooks'

function Catalogo() {
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [author, setAuthor] = useState('')
  const [availability, setAvailability] = useState('')
  const [language, setLanguage] = useState('')
  const [period, setPeriod] = useState('')

  const resetFilters = () => {
    setSearch('')
    setGenre('')
    setAuthor('')
    setAvailability('')
    setLanguage('')
    setPeriod('')
  }

  return (
    <div className="w-full px-gutter py-space-lg flex flex-col gap-space-lg max-w-[1520px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-medium">
              Acervo Académico
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm tracking-wide">Fondo General & Repositorio Digital</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Catálogo de Libros</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            Exploración y reserva bibliográfica del fondo general, colecciones de acceso restringido y recursos de
            consulta electrónica.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button className="inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]" type="button">
            <span className="material-symbols-outlined text-title-md">add</span>
            <span>Agregar libro</span>
          </button>
        </div>
      </header>

      {/* Filtros */}
      <section aria-label="Filtros del catálogo" className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end gap-space-sm">
            <div className="flex items-center gap-2 px-space-sm py-2 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm w-full md:w-auto justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-body-md text-secondary">verified</span>
                <span>Ediciones autenticadas</span>
              </div>
              <span className="text-on-surface-variant/50 font-mono text-[10px]">ISO-2709</span>
            </div>
            <button
              className="inline-flex items-center gap-1 px-3 py-2 text-on-surface-variant hover:text-secondary font-label-sm text-label-sm transition-colors whitespace-nowrap"
              onClick={resetFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-body-sm">restart_alt</span>
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm pt-space-xs">
          <FilterSelect label="Género & Materia" value={genre} onChange={setGenre} options={catalogFilters.genres} placeholder="Todos los géneros" />
          <FilterSelect label="Autor de Referencia" value={author} onChange={setAuthor} options={catalogFilters.authors} placeholder="Todos los autores" />
          <FilterSelect label="Disponibilidad" value={availability} onChange={setAvailability} options={catalogFilters.availability} placeholder="Cualquier estado" />
          <FilterSelect label="Idioma de Edición" value={language} onChange={setLanguage} options={catalogFilters.languages} placeholder="Todos los idiomas" />
          <FilterSelect label="Periodo Histórico" value={period} onChange={setPeriod} options={catalogFilters.periods} placeholder="Todos los periodos" />
        </div>
      </section>

      {/* Contador y orden */}
      <section className="flex items-center justify-between gap-space-md py-space-xs">
        <div className="flex items-center gap-space-sm">
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            Mostrando {catalogBooks.length} de 1,420 obras catalogadas
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
            FILTRADO ACTIVO
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

      {/* Grilla de libros */}
      <section aria-label="Catálogo de libros disponibles" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-lg">
        {catalogBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </section>

      {/* Paginación */}
      <footer aria-label="Navegación de páginas" className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-sm">
        <div className="flex items-center gap-space-sm text-on-surface-variant">
          <label className="font-body-sm text-body-sm" htmlFor="items-per-page">
            Mostrar:
          </label>
          <select className="bg-surface-container-low text-on-surface font-label-md text-label-md px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer" id="items-per-page">
            <option value="12">12 obras por página</option>
            <option value="24">24 obras por página</option>
            <option value="48">48 obras por página</option>
          </select>
          <span className="hidden sm:inline font-body-sm text-body-sm text-on-surface-variant/60 ml-2">Página 1 de 119</span>
        </div>
        <nav aria-label="Paginador" className="flex items-center gap-1">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md text-on-surface-variant/40 cursor-not-allowed" disabled type="button">
            <span className="material-symbols-outlined text-body-md">chevron_left</span>
            <span>Anterior</span>
          </button>
          <div className="flex items-center gap-1 mx-1">
            <button aria-current="page" className="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center font-medium shadow-xs" type="button">
              1
            </button>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors" type="button">
              2
            </button>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors" type="button">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant/60 text-body-sm">…</span>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors" type="button">
              24
            </button>
          </div>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors" type="button">
            <span>Siguiente</span>
            <span className="material-symbols-outlined text-body-md">chevron_right</span>
          </button>
        </nav>
      </footer>
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
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-2.5 text-body-sm text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  )
}

export default Catalogo
