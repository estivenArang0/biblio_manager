import { catalogBooks } from '../src/data/catalogBooks.js'
import { addDays, ymd } from './util.js'

/**
 * Datos iniciales del portal.
 *
 * Los libros parten del catálogo que ya existía en el prototipo (`src/data`),
 * pero el contenido de lectura y la disponibilidad viven ahora en la base de
 * datos del servidor, nunca en el cliente.
 */
export const DEMO_PASSWORD = '123456'

export const seedUsers = [
  { nombre: 'Ana María Restrepo', correo: 'estudiante@tdea.edu.co', rol: 'Estudiante' },
  { nombre: 'Mateo Gómez Salazar', correo: 'mateo.gomez@tdea.edu.co', rol: 'Estudiante' },
  { nombre: 'Carlos Jaramillo', correo: 'profesor.jaramillo@tdea.edu.co', rol: 'Docente' },
  { nombre: 'Patricia Restrepo Vélez', correo: 'patricia.restrepo@tdea.edu.co', rol: 'Docente' },
  { nombre: 'Luisa Fernanda Gómez', correo: 'bibliotecario.central@tdea.edu.co', rol: 'Bibliotecario' },
  { nombre: 'Administrador TdeA', correo: 'admin@tdea.edu.co', rol: 'Administrador' },
]

const bookMeta = {
  quijote: {
    isbn: '978-84-376-0494-7',
    format: 'Digital y físico',
    digital: 1,
    physical: 1,
    description: 'Novela fundacional de la literatura moderna. Esta edición digital incluye los capítulos VIII y IX con notas de cátedra.',
  },
  aleph: {
    isbn: '978-84-206-3313-4',
    format: 'Solo consulta en sala',
    digital: 0,
    physical: 1,
    description: 'Colección de cuentos y ensayos borgianos. Ejemplar de sala rara, no circula a domicilio.',
  },
  'cien-anos': {
    isbn: '978-84-376-0495-4',
    format: 'Físico',
    digital: 0,
    physical: 1,
    description: 'Edición conmemorativa de la obra cumbre del realismo mágico latinoamericano.',
  },
  'formas-tipograficas': {
    isbn: '978-84-252-2934-2',
    format: 'Digital',
    digital: 1,
    physical: 0,
    description: 'Tratado clásico sobre diseño editorial y composición tipográfica, disponible en formato digital.',
  },
  semiotica: {
    isbn: '978-84-8432-256-1',
    format: 'Digital y físico',
    digital: 1,
    physical: 1,
    description: 'Estudio sistemático de los signos y su incidencia en la interpretación del lenguaje.',
  },
  'infinito-junco': {
    isbn: '978-84-204-3305-1',
    format: 'Digital y audiolibro',
    digital: 1,
    physical: 0,
    description: 'Ensayo sobre la historia del libro y de las bibliotecas, con versión digital y audiolibro.',
  },
  'segundo-sexo': {
    isbn: '978-84-376-0496-1',
    format: 'Físico',
    digital: 0,
    physical: 1,
    description: 'Edición crítica de la obra fundacional del pensamiento feminista contemporáneo.',
  },
  'discurso-metodo': {
    isbn: '978-84-309-5624-0',
    format: 'Solo consulta en sala',
    digital: 0,
    physical: 1,
    description: 'Archivo histórico del Discurso del método, conservado para consulta en sala.',
  },
}

const quijoteGlossary = [
  {
    term: 'Desaforados gigantes',
    tag: 'adj. arcaico',
    def: 'Que actúan fuera de todo fuero, desmesurados o desmedidamente soberbios en talla y ley.',
  },
  {
    term: 'Aspas',
    tag: 'sust. femenino',
    def: 'Maderos cruzados en forma de aspa o equis sobre el eje del molino.',
  },
  {
    term: 'Briareo',
    tag: 'onomástica mítica',
    def: 'Titán o hecatónquiro de la mitología clásica, dotado de cien brazos y cincuenta cabezas.',
  },
]

const quijotePages = [
  {
    folio: 142,
    chapter: 'PARTE PRIMERA • CAPÍTULO VIII',
    paragraphs: [
      `En esto, descubrieron treinta o cuarenta molinos de viento que hay en aquel campo; y, así como don Quijote los vio, dijo a su escudero: —La ventura va guiando nuestras cosas mejor de lo que acertáramos a desear; porque ves allí, amigo Sancho Panza, donde se descubren treinta, o pocos más, desaforados gigantes, con quien pienso hacer batalla y quitarles a todos las vidas, con cuyos despojos comenzaremos a enriquecer; que ésta es buena guerra, y es gran servicio de Dios quitar tan mala simiente de sobre la faz de la tierra.`,
      `—¿Qué gigantes? —dijo Sancho Panza. —Aquellos que allí ves —respondió su amo—, de los brazos largos, que los suelen tener algunos de casi dos leguas. —Mire vuestra merced —respondió Sancho— que aquellos que allí se parecen no son gigantes, sino molinos de viento, y lo que en ellos parecen brazos son las aspas, que, volteadas del viento, hacen andar la piedra del molino.`,
      `—Bien parece —respondió don Quijote— que no estás cursado en esto de las aventuras: ellos son gigantes; y si tienes miedo, quítate de ahí, y ponte en oración en el espacio que yo voy a entrar con ellos en fiera y desigual batalla.`,
      `Y, diciendo esto, dio de espuelas a su caballo Rocinante, sin atender a las voces que su escudero Sancho le daba, advirtiéndole que, sin duda alguna, eran molinos de viento, y no gigantes, aquellos que iba a acometer.`,
    ],
    trivia: {
      question:
        '¿Cuál es la interpretación retórica y psicológica que Cervantes atribuye al contraste entre don Quijote y Sancho Panza ante la aparición de los molinos de viento?',
      correctOption: 'A',
      options: [
        {
          id: 'A',
          text: 'Una contraposición dialéctica entre el idealismo caballeresco absoluto y el pragmatismo empírico terrenal.',
          hint: 'Perspectiva humanista clásica',
        },
        {
          id: 'B',
          text: 'Una crítica paródica exclusiva a los molineros manchegos de la época.',
          hint: 'Lectura costumbrista literal',
        },
        {
          id: 'C',
          text: 'Una demostración de cobardía por parte del escudero frente a una amenaza bélica real.',
          hint: 'Lectura fáctica militar',
        },
      ],
      explanation:
        'En esta escena capital, Cervantes instaura la dualidad moderna: mientras Quijote proyecta su universo moral y simbólico sobre la realidad física materializándola en "desaforados gigantes", Sancho actúa como ancla perceptiva y sentido común popular.',
    },
    glossary: quijoteGlossary,
  },
  {
    folio: 143,
    chapter: 'PARTE PRIMERA • CAPÍTULO VIII (CONTINUACIÓN)',
    paragraphs: [
      `Iba don Quijote tan puesto en que eran gigantes, que ni oía las voces de su escudero Sancho, ni echaba de ver, aunque estaba ya bien cerca, lo que eran; antes iba diciendo a grandes voces: —¡Non fuyades, cobardes y viles criaturas, que un solo caballero es el que os acomete!`,
      `Levantóse en esto un poco de viento, y las grandes aspas comenzaron a moverse, lo cual visto por don Quijote, dijo: —Pues aunque mováis más brazos que los del gigante Briareo, me lo habéis de pagar.`,
      `Y, diciendo esto, y encomendándose de todo corazón a su señora Dulcinea, pidiéndole que en tal trance le socorriese, bien cubierto de su rodela, con la lanza en el ristre, arremetió a todo el galope de Rocinante y embistió con el primer molino que estaba delante; y dándole una lanzada en el aspa, la volvió el viento con tanta furia, que hizo la lanza pedazos, llevándose tras sí al caballo y al caballero, que fue rodando muy maltrecho por el campo.`,
    ],
    trivia: {
      question: '¿A qué figura mitológica alude don Quijote al desafiar el movimiento de las aspas del molino?',
      correctOption: 'B',
      options: [
        {
          id: 'A',
          text: 'Al cíclope Polifemo que custodia las costas de Sicilia.',
          hint: 'Mitología homérica de la Odisea',
        },
        {
          id: 'B',
          text: 'Al gigante Briareo, monstruo de cien brazos y cincuenta cabezas.',
          hint: 'Mitología hesiódica clásica de la Titanomaquia',
        },
        {
          id: 'C',
          text: 'Al minotauro Asterión encerrado en el laberinto de Creta.',
          hint: 'Mitología clásica ateniense',
        },
      ],
      explanation:
        'Don Quijote invoca explícitamente a Briareo, el hecatónquiro mitológico que poseía cien brazos, justificando en su imaginario caballeresco el número desmesurado de miembros que parecían agitar los molinos.',
    },
    glossary: quijoteGlossary,
  },
]

const genericGlossary = [
  {
    term: 'Exégesis',
    tag: 'sust. femenino',
    def: 'Interpretación crítica, sistemática y contextual de un texto literario o documental.',
  },
  {
    term: 'Intertextualidad',
    tag: 'sust. femenino',
    def: 'Relación de diálogo, alusión o resonancia que un texto establece con otras creaciones del canon.',
  },
  {
    term: 'Hermenéutica',
    tag: 'teoría del arte',
    def: 'Metodología interpretativa orientada al esclarecimiento del sentido profundo y la intencionalidad estética.',
  },
]

/** Genera tres folios de lectura para cualquier libro registrado. */
export function buildGenericPages(book) {
  const titulo = book.title || 'Obra académica'
  const autor = book.author || 'Autor institucional'
  const signatura = book.signature || 'BIB-S/N'
  return [
    {
      folio: 1,
      chapter: 'SECCIÓN PRELIMINAR • APERTURA DE TEXTO CRÍTICO',
      paragraphs: [
        `El presente ejemplar digitalizado de "${titulo}", cuya autoría corresponde a ${autor}, forma parte del acervo curricular protegido de la institución bajo signatura topográfica ${signatura}.`,
        `En las páginas iniciales de este volumen, la construcción narrativa y discursiva propone una inmersión directa en las problemáticas estilísticas y contextuales de la época de su composición, estableciendo un diálogo riguroso entre la tradición literaria precedente y las innovaciones formales del autor.`,
        `A través de la lectura analítica de este primer folio, se invita al lector a examinar con detenimiento los recursos retóricos, la estructura de los enunciados y la intencionalidad estética subyacente que posicionan a "${titulo}" como una obra fundamental para los estudios contemporáneos.`,
      ],
      trivia: {
        question: `¿Cuál es el propósito hermenéutico principal del enfoque analítico propuesto para la obra "${titulo}"?`,
        correctOption: 'A',
        options: [
          {
            id: 'A',
            text: 'Desentrañar las tensiones formales, retóricas y contextuales inherentes a la propuesta estética del autor.',
            hint: 'Análisis textual crítico e interdisciplinar',
          },
          {
            id: 'B',
            text: 'Reducir la obra a un mero ejercicio de memorización cronológica sin interpretación crítica.',
            hint: 'Lectura memorística pasiva',
          },
          {
            id: 'C',
            text: 'Descartar la relevancia de los recursos estilísticos para atender únicamente a la trama superficial.',
            hint: 'Lectura pragmática descontextualizada',
          },
        ],
        explanation: `El estudio crítico de "${titulo}" exige articular la forma literaria con su horizonte histórico y conceptual.`,
      },
      glossary: genericGlossary,
    },
    {
      folio: 2,
      chapter: 'DESARROLLO EXEGÉTICO • LECTURA AVANZADA',
      paragraphs: [
        `Avanzando en la lectura de "${titulo}", los núcleos temáticos se profundizan, revelando una compleja red de significados simbólicos y relaciones intertextuales que dialogan con el canon académico universal.`,
        `El autor articula una voz particular donde las decisiones de perspectiva, el ritmo de la prosa y la selección léxica configuran una experiencia estética integral.`,
        `La estructura del texto alterna pasajes de reflexión teórica con secuencias narrativas que desplazan el foco desde la anécdota hacia la pregunta por el sentido, recurso característico de ${autor}.`,
      ],
      trivia: {
        question: `¿Cómo contribuye la articulación de la voz y el ritmo expresivo en "${titulo}" al desarrollo de su propuesta temática?`,
        correctOption: 'B',
        options: [
          {
            id: 'A',
            text: 'Generando una estructura uniforme que evade el diálogo con otras obras de la disciplina.',
            hint: 'Enfoque estático y aislado',
          },
          {
            id: 'B',
            text: 'Consolidando una estética integral que interpela al lector crítico mediante relaciones intertextuales y recursos de estilo.',
            hint: 'Postura dialógica formativa',
          },
          {
            id: 'C',
            text: 'Subordinando el contenido a fórmulas retóricas convencionales sin aporte reflexivo.',
            hint: 'Enfoque mecánico desprovisto de fondo',
          },
        ],
        explanation:
          'La maestría del autor radica en entrelazar la cadencia discursiva con un rigor temático que potencia la exégesis de la obra.',
      },
      glossary: genericGlossary,
    },
    {
      folio: 3,
      chapter: 'CIERRE • HORIZONTE INTERPRETATIVO',
      paragraphs: [
        `El tramo final de "${titulo}" recompone los hilos temáticos abiertos en los folios anteriores y deja al lector ante un horizonte interpretativo abierto, propio de las obras que resisten una clausura definitiva.`,
        `La lectura crítica exige volver sobre las marcas estilísticas y los silencios del texto: allí donde la enunciación se interrumpe, el sentido continúa desplazándose hacia nuevas lecturas posibles.`,
      ],
      trivia: {
        question: '¿Qué actitud crítica resulta más pertinente al cerrar la lectura de una obra abierta a múltiples interpretaciones?',
        correctOption: 'C',
        options: [
          {
            id: 'A',
            text: 'Fijar una única interpretación definitiva y descartar las lecturas alternativas.',
            hint: 'Clausura dogmática del sentido',
          },
          {
            id: 'B',
            text: 'Sustituir el análisis textual por la opinión personal sin evidencia en el texto.',
            hint: 'Impresionismo sin sustento',
          },
          {
            id: 'C',
            text: 'Reconstruir los hilos temáticos y contrastar las marcas formales con el contexto de producción.',
            hint: 'Síntesis hermenéutica argumentada',
          },
        ],
        explanation:
          'La lectura académica articula evidencia textual, contexto y argumentación; la interpretación se sostiene en el texto y no en la sola impresión del lector.',
      },
      glossary: genericGlossary,
    },
  ]
}

export const seedBooks = catalogBooks.map((book) => {
  const meta = bookMeta[book.id] || {}
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    tag: book.tag || '',
    genre: book.genre || book.tag || '',
    isbn: meta.isbn || `978-958-${Math.floor(1000 + Math.random() * 9000)}-01`,
    signature: book.signature || '',
    year: book.year || '',
    format: meta.format || 'Digital',
    digital: meta.digital ?? 1,
    physical: meta.physical ?? 0,
    image: book.image,
    description: meta.description || `Obra del acervo institucional: ${book.title}.`,
    pages: book.id === 'quijote' ? quijotePages : buildGenericPages(book),
  }
})

export function buildSeedLoans() {
  const today = ymd()
  return [
    {
      user: 'estudiante@tdea.edu.co',
      book: 'quijote',
      status: 'activo',
      loanDate: addDays(today, -3),
      dueDate: addDays(today, 5),
      requestedDays: 8,
    },
    {
      user: 'estudiante@tdea.edu.co',
      book: 'cien-anos',
      status: 'activo',
      loanDate: addDays(today, -6),
      dueDate: addDays(today, 2),
      requestedDays: 8,
    },
    {
      user: 'estudiante@tdea.edu.co',
      book: 'aleph',
      status: 'activo',
      loanDate: addDays(today, -15),
      dueDate: addDays(today, -7),
      requestedDays: 8,
    },
    {
      user: 'estudiante@tdea.edu.co',
      book: 'semiotica',
      status: 'devuelto',
      loanDate: addDays(today, -40),
      dueDate: addDays(today, -32),
      returnedAt: `${addDays(today, -34)}T15:20:00.000Z`,
      requestedDays: 8,
    },
    {
      user: 'mateo.gomez@tdea.edu.co',
      book: 'discurso-metodo',
      status: 'activo',
      loanDate: addDays(today, -2),
      dueDate: addDays(today, 6),
      requestedDays: 8,
    },
    {
      user: 'mateo.gomez@tdea.edu.co',
      book: 'segundo-sexo',
      status: 'devuelto',
      loanDate: addDays(today, -25),
      dueDate: addDays(today, -17),
      returnedAt: `${addDays(today, -18)}T10:05:00.000Z`,
      requestedDays: 8,
    },
    {
      user: 'profesor.jaramillo@tdea.edu.co',
      book: 'formas-tipograficas',
      status: 'activo',
      loanDate: addDays(today, -10),
      dueDate: addDays(today, 20),
      requestedDays: 30,
    },
    {
      user: 'profesor.jaramillo@tdea.edu.co',
      book: 'infinito-junco',
      status: 'devuelto',
      loanDate: addDays(today, -60),
      dueDate: addDays(today, -30),
      returnedAt: `${addDays(today, -31)}T09:40:00.000Z`,
      requestedDays: 30,
    },
    {
      user: 'patricia.restrepo@tdea.edu.co',
      book: 'semiotica',
      status: 'activo',
      loanDate: addDays(today, -5),
      dueDate: addDays(today, 25),
      requestedDays: 30,
    },
    {
      user: 'patricia.restrepo@tdea.edu.co',
      book: 'quijote',
      status: 'devuelto',
      loanDate: addDays(today, -90),
      dueDate: addDays(today, -60),
      returnedAt: `${addDays(today, -61)}T16:15:00.000Z`,
      requestedDays: 30,
    },
  ]
}

export function buildSeedReadingEvents() {
  const today = ymd()
  return [
    { user: 'estudiante@tdea.edu.co', book: 'quijote', event: 'open', at: `${addDays(today, -1)}T14:02:00.000Z` },
    { user: 'estudiante@tdea.edu.co', book: 'quijote', event: 'close', at: `${addDays(today, -1)}T14:41:00.000Z` },
    { user: 'profesor.jaramillo@tdea.edu.co', book: 'formas-tipograficas', event: 'open', at: `${addDays(today, -2)}T09:10:00.000Z` },
    { user: 'profesor.jaramillo@tdea.edu.co', book: 'formas-tipograficas', event: 'close', at: `${addDays(today, -2)}T09:55:00.000Z` },
  ]
}
