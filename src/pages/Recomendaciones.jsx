import { useState } from 'react'
import { intentChips, recommendedBooks, researchLines } from '../data/recommendations'

function Recomendaciones() {
  const [activeIntent, setActiveIntent] = useState(intentChips[0])

  return (
    <div className="px-gutter py-space-lg flex flex-col gap-space-xl max-w-7xl mx-auto w-full">
      {/* Banner principal */}
      <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-md">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary-container opacity-10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 p-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 text-on-primary-container font-label-sm text-label-sm mb-space-sm backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm text-secondary-container">psychology</span>
                <span>Motor de Recuperación Semántica v4.2</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-primary tracking-tight">
                Descubre tu próxima gran lectura
              </h1>
              <p className="font-body-md text-body-md text-surface-container-highest mt-space-xs leading-relaxed">
                Sugerencias generadas por análisis semántico de temas, autores afines y consultas en el repositorio
                bibliográfico institucional.
              </p>
            </div>
            <div className="flex items-center gap-space-xs text-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>Ajustado al perfil de lectura académica</span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <span className="font-label-sm text-label-sm text-surface-container-highest tracking-wide uppercase">
              Intención y enfoque conceptual
            </span>
            <div className="flex flex-wrap gap-space-xs">
              {intentChips.map((chip) => {
                const isActive = chip === activeIntent
                return (
                  <button
                    key={chip}
                    onClick={() => setActiveIntent(chip)}
                    className={
                      isActive
                        ? 'group px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-colors bg-secondary text-on-secondary shadow-sm'
                        : 'px-3.5 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-colors bg-surface-container-lowest/10 text-on-primary hover:bg-surface-container-lowest/20'
                    }
                    type="button"
                  >
                    {isActive && <span className="material-symbols-outlined text-sm">check</span>}
                    <span>{chip}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Progreso de lectura actual */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
        <div className="flex items-start sm:items-center gap-space-md w-full md:w-auto">
          <div className="w-16 h-24 rounded-lg bg-surface-container-low shrink-0 overflow-hidden shadow-sm relative">
            <img
              className="w-full h-full object-cover"
              alt="Portada de Don Quijote de la Mancha"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBBpq5QnV7lyKP_2TFhV499FckQBW4IBtkPOaOm1QzrNAq4yr9CmWjVKnY1lnwEQiKORoeK-J-A4alDHaIIcTXG1CAaxtq9xHnTyUXAz07iV5Wfx19s3WtMXwgx2TyKqhoxgoApg-nOkqi6C-SUI7b_JPVyEzeiQhZQ0WUca3I6BxlZilKXVtWwiEHC02i0AtyV5xCvjgg0sAeWgc_12ipyaPmwxYg8p0Dr0hFuqo6nXDCcT70Pu-E"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-label-sm text-secondary font-medium uppercase tracking-wider">
                Lectura en curso actualmente
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Signatura: LIT-HIS-C45</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">Don Quijote de la Mancha</h2>
            <span className="font-body-md text-body-md text-on-surface-variant">
              Miguel de Cervantes Saavedra (Edición Crítica RAE)
            </span>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md mt-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-on-surface">bookmark</span>
                Capítulo VIII en consulta
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-on-surface">schedule</span>
                Último acceso hoy a las 10:15 h
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end shrink-0">
          <button className="px-space-md py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-lg text-label-lg rounded-lg shadow-sm transition-colors flex items-center gap-2" type="button">
            <span>Continuar leyendo</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Grilla de recomendaciones */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-secondary font-medium tracking-wider uppercase">
              Selección Algorítmica
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Recomendaciones afinadas por corpus semántico</h2>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
            {recommendedBooks.length} títulos encontrados con correlación &gt; 85%
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {recommendedBooks.map((book) => (
            <div key={book.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-space-sm">
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
                  <img className="w-full h-full object-cover" src={book.image} alt={`Portada de ${book.title}`} />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary text-on-primary shadow-sm font-medium">
                    {book.affinity}
                  </span>
                </div>
                <div className="flex flex-col pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{book.author}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mt-0.5 leading-snug">
                    {book.title}
                  </h3>
                  <div className="mt-space-xs p-space-xs rounded bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                    {book.reason}
                  </div>
                </div>
              </div>
              <div className="pt-space-md mt-auto">
                <button className="w-full py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5" type="button">
                  <span className="material-symbols-outlined text-sm">bookmark_add</span>
                  <span>Reservar en catálogo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Líneas de investigación */}
      <div className="flex flex-col gap-space-md pb-space-lg">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Caminos metodológicos</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Líneas de investigación sugeridas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {researchLines.map((line) => (
            <div key={line.title} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-space-xs">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary mb-1">
                  <span className="material-symbols-outlined text-title-lg">{line.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{line.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">{line.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-space-sm">
                  {line.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button className="mt-space-md inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline self-start" type="button">
                <span>Explorar corpus temático</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Recomendaciones
