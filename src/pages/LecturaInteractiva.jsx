import { useState } from 'react'

const fontSizes = [16, 18, 20, 22]
const readingModes = {
  light: { bg: '#ffffff', color: '#191c1e', label: 'Claro', swatch: '#f7f9fb' },
  sepia: { bg: '#faedd9', color: '#2a1704', label: 'Sepia', swatch: '#faedd9' },
  night: { bg: '#111c2e', color: '#e2e8f0', label: 'Noche', swatch: '#1c2430' },
}

const quizOptions = [
  {
    id: 'A',
    text: 'Una contraposición dialéctica entre el idealismo caballeresco absoluto y el pragmatismo empírico terrenal.',
    hint: 'Perspectiva hegeliana y crítica humanista clásica',
  },
  {
    id: 'B',
    text: 'Una crítica paródica exclusiva a los molineros manchegos de la época.',
    hint: 'Lectura costumbrista literal',
  },
  {
    id: 'C',
    text: 'Una demostración de cobardía por parte del escudero frente a una amenaza bélica real.',
    hint: 'Lectura de carácter fáctico militar',
  },
]

const glossary = [
  {
    term: 'Desaforados gigantes',
    tag: 'adj. arcaico',
    def: 'Que actúan fuera de todo fuero, desmesurados o desmedidamente soberbios en talla y ley. Referencia directa a los libros de caballerías como el Amadís de Gaula.',
  },
  {
    term: 'Aspas',
    tag: 'sust. femenino',
    def: 'Maderos cruzados en forma de aspa o equis sobre el eje del molino para sujetar los lienzos que reciben el impulso del viento.',
  },
  {
    term: 'Frestón el sabio encantador',
    tag: 'onomástica mítica',
    def: 'Figura ficticia a quien don Quijote culpa de la desaparición de su biblioteca y de metamorfosear a los gigantes en molinos.',
  },
]

function LecturaInteractiva() {
  const [fontIndex, setFontIndex] = useState(1)
  const [mode, setMode] = useState('light')
  const [selectedOption, setSelectedOption] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const currentMode = readingModes[mode]

  const handleValidate = () => setShowFeedback(true)

  return (
    <div className="flex flex-col w-full">
      {/* Barra de Herramientas Superior */}
      <header className="sticky top-16 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm">
        <div className="max-w-[1720px] mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <span className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-title-lg">menu_book</span>
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                  Don Quijote de la Mancha
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium whitespace-nowrap">
                  Edición Crítica RAE
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Miguel de Cervantes Saavedra • Edición conmemorativa IV Centenario
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto max-w-md">
            <div className="relative w-full">
              <select className="w-full appearance-none pl-3 pr-9 py-1.5 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-lowest cursor-pointer">
                <option>Capítulo VIII: Del buen suceso que el valeroso don Quijote tuvo en la espantable aventura de los molinos de viento...</option>
                <option>Capítulo VII: De la segunda salida de nuestro buen caballero don Quijote de la Mancha...</option>
                <option>Capítulo IX: Donde se concluye y da fin a la estupenda batalla que el gallardo vizcaíno...</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-body-lg">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 shadow-sm">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors font-label-md text-label-md font-semibold"
                onClick={() => setFontIndex((i) => Math.max(0, i - 1))}
                title="Reducir fuente"
              >
                A-
              </button>
              <span className="px-2 font-label-sm text-label-sm text-on-surface font-medium min-w-[40px] text-center">
                {fontSizes[fontIndex]}px
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors font-label-md text-label-md font-semibold"
                onClick={() => setFontIndex((i) => Math.min(fontSizes.length - 1, i + 1))}
                title="Aumentar fuente"
              >
                A+
              </button>
            </div>

            <div className="flex items-center bg-surface-container-low rounded-lg p-1 gap-1 shadow-sm">
              {Object.entries(readingModes).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={
                    mode === key
                      ? 'px-2.5 py-1 rounded-md text-label-sm font-label-sm bg-surface-container-lowest text-on-surface font-medium shadow-sm transition-all flex items-center gap-1.5'
                      : 'px-2.5 py-1 rounded-md text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-1.5'
                  }
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.swatch }}></span>
                  {m.label}
                </button>
              ))}
            </div>

            <button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center justify-center" title="Ajustar interlineado">
              <span className="material-symbols-outlined text-title-lg">format_line_spacing</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-surface-container h-1 relative overflow-hidden">
          <div className="bg-secondary h-full transition-all duration-300" style={{ width: '64.5%' }}></div>
        </div>
        <div className="max-w-[1720px] mx-auto px-6 py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low/40">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Página 142 de 220 • Páginas leídas del tomo I</span>
          </div>
          <span className="font-medium">64% de avance del texto curado</span>
        </div>
      </header>

      <div className="max-w-[1720px] mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna de lectura */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            <article
              className="relative rounded-xl p-8 md:p-14 shadow-sm transition-colors duration-300"
              style={{ backgroundColor: currentMode.bg, color: currentMode.color }}
            >
              <div className="flex items-center justify-between pb-6 mb-8 text-on-surface-variant font-label-sm text-label-sm tracking-widest uppercase">
                <span>PARTE PRIMERA • CAPÍTULO VIII</span>
                <span className="font-semibold text-secondary">FOLIO 142</span>
              </div>

              <div
                className="font-headline-md leading-relaxed text-justify space-y-6 select-text"
                style={{ fontSize: `${fontSizes[fontIndex]}px`, lineHeight: `${fontSizes[fontIndex] * 1.65}px` }}
              >
                <p className="relative">
                  <span className="float-left text-7xl font-headline-lg text-primary mr-4 mt-1 mb-0 leading-[0.8] font-bold select-none">
                    E
                  </span>
                  n esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo; y, así como don
                  Quijote los vio, dijo a su escudero: —La ventura va guiando nuestras cosas mejor de lo que
                  acertáramos a desear; porque ves allí, amigo Sancho Panza, donde se descubren{' '}
                  <mark className="bg-[#fed7aa]/70 px-1 py-0.5 rounded cursor-pointer" title="Vocabulario filológico">
                    treinta, o pocos más, desaforados gigantes
                  </mark>
                  , con quien pienso hacer batalla y quitarles a todos las vidas, con cuyos despojos comenzaremos a
                  enriquecer; que ésta es buena guerra, y es gran servicio de Dios quitar tan mala simiente de sobre
                  la faz de la tierra.
                </p>
                <p>
                  —¿Qué gigantes? —dijo Sancho Panza. —Aquellos que allí ves —respondió su amo—, de los brazos
                  largos, que los suelen tener algunos de casi dos leguas. —Mire vuestra merced —respondió Sancho—
                  que{' '}
                  <mark className="bg-[#fde68a]/70 px-1 py-0.5 rounded cursor-pointer" title="Cita anotada">
                    aquellos que allí se parecen no son gigantes, sino molinos de viento
                  </mark>
                  , y lo que en ellos parecen brazos son{' '}
                  <mark className="bg-[#bfdbfe]/70 px-1 py-0.5 rounded cursor-pointer" title="Vocabulario técnico">
                    las aspas
                  </mark>
                  , que, volteadas del viento, hacen andar la piedra del molino.
                </p>
                <p>
                  —Bien parece —respondió don Quijote— que no estás cursado en esto de las aventuras: ellos son
                  gigantes; y si tienes miedo, quítate de ahí, y ponte en oración en el espacio que yo voy a entrar
                  con ellos en fiera y desigual batalla.
                </p>
                <p>
                  Y, diciendo esto, dio de espuelas a su caballo Rocinante, sin atender a las voces que su escudero
                  Sancho le daba, advirtiéndole que, sin duda alguna, eran molinos de viento, y no gigantes, aquellos
                  que iba a acometer.
                </p>
              </div>

              <footer className="mt-12 pt-6 bg-surface-container-low/50 -mx-8 md:-mx-14 -mb-8 md:-mb-14 px-8 md:px-14 py-5 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface hover:shadow-sm font-label-md text-label-md transition-all">
                  <span className="material-symbols-outlined text-body-lg">arrow_back</span>
                  <span>Capítulo anterior (Cap. VII)</span>
                </button>
                <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                  <span>Página</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-semibold text-on-surface shadow-sm">142</span>
                  <span>de 220</span>
                </div>
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md shadow-sm transition-all">
                  <span>Siguiente página (Folio 143)</span>
                  <span className="material-symbols-outlined text-body-lg">arrow_forward</span>
                </button>
              </footer>
            </article>
          </section>

          {/* Panel de comprensión lectora */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-headline-sm">psychology</span>
                  </span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Herramientas de Comprensión</h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Análisis textual y aparato crítico</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Módulo Académico
                </span>
              </div>

              {/* Trivia */}
              <section className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    Actividad Exegética • Capítulo VIII
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-label-lg">quiz</span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-semibold leading-snug">
                  ¿Cuál es la interpretación retórica y psicológica que Cervantes atribuye al contraste entre don
                  Quijote y Sancho Panza ante la aparición de los molinos de viento?
                </h3>

                <div className="flex flex-col gap-2.5 pt-1">
                  {quizOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="group flex items-start gap-3 p-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition-all cursor-pointer shadow-sm"
                    >
                      <input
                        className="mt-1 text-primary focus:ring-0 cursor-pointer"
                        name="quijote-quiz"
                        type="radio"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-medium leading-relaxed">
                          [{opt.id}] {opt.text}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{opt.hint}</span>
                      </div>
                    </label>
                  ))}

                  <button
                    className="mt-2 w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2"
                    onClick={handleValidate}
                    type="button"
                    disabled={!selectedOption}
                  >
                    <span className="material-symbols-outlined text-body-md">fact_check</span>
                    <span>Validar respuesta y ver análisis crítico</span>
                  </button>
                </div>

                {showFeedback && (
                  <div className="mt-2 p-4 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm leading-relaxed">
                    <div className="flex items-center gap-2 text-secondary font-semibold font-label-md text-label-md mb-1.5">
                      <span className="material-symbols-outlined text-title-lg">verified</span>
                      <span>Respuesta Correcta: [A]</span>
                    </div>
                    <p className="text-on-surface-variant">
                      En esta escena capital, Cervantes instaura el arquetipo de la dualidad moderna: mientras
                      Quijote superpone su universo moral y simbólico sobre la realidad física materializándola en
                      "desaforados gigantes", Sancho actúa como ancla perceptiva y sentido común popular.
                    </p>
                  </div>
                )}
              </section>

              {/* Glosario */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Vocabulario Filológico del Fragmento
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{glossary.length} términos anotados</span>
                </div>
                <div className="space-y-2.5">
                  {glossary.map((g) => (
                    <div key={g.term} className="p-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md font-semibold text-secondary">{g.term}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm">
                          {g.tag}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">{g.def}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="p-3.5 rounded-lg bg-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-title-lg text-on-surface-variant">inventory_2</span>
                  <span>
                    Ejemplar físico: Biblioteca Central • Signatura: <strong>LIT-CER-008</strong>
                  </span>
                </div>
                <span className="font-medium text-on-surface">Préstamo regular</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default LecturaInteractiva
