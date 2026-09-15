export const navItems = [
  { path: 'catalogo-de-libros', label: 'Catálogo de Libros', icon: 'menu_book' },
  { path: 'lectura-interactiva', label: 'Lectura Interactiva', icon: 'auto_stories' },
  { path: 'recomendaciones-ia', label: 'Recomendaciones IA', icon: 'psychology_alt' },
  { path: 'historial-y-movimientos', label: 'Historial & Movimientos', icon: 'sync_alt' },
]

export const moods = [
  { id: 'explorar', label: 'Explorar nuevos mundos', icon: 'travel_explore' },
  { id: 'critico', label: 'Desarrollar pensamiento crítico', icon: 'psychology' },
  { id: 'ligera', label: 'Lectura ligera de fin de semana', icon: 'spa' },
  { id: 'clasicos', label: 'Profundizar en clásicos universales', icon: 'history_edu' },
]

export const affinityBreakdown = [
  { label: 'Realismo Mágico (35%)', colorClass: 'bg-secondary' },
  { label: 'Filosofía (25%)', colorClass: 'bg-primary' },
  { label: 'Ensayo Científico (20%)', colorClass: 'bg-surface-tint' },
]

export const recommendations = [
  {
    id: 'invierno-viajero',
    title: 'Si una noche de invierno un viajero',
    author: 'Italo Calvino (1979)',
    affinity: 96,
    tag: 'Metaficción',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqGpTAe3Y1JME3LCicFTQ5-wSJ95xbmQD6kQr0smjxFaConNuuCeUDFhkXDkNbeR1VKFDuK5-btRf6ei_FIa5l7K9ly0pp1HV2732oZ1FkhfsFV2jtCJeRLrZpgdqO7D_vuZsyTWLwQnypKMrE_xsbaehNUEk2sQsz_UTNUUJMcwD_FUlzdXTUMAcE6FAUoP2Wo0x254i1wGOmRgmAsXoSCQYUibw9roPoqgysgtaM86rRd0WhJYUP',
    analysis:
      'Recomendado por su estructura laberíntica, juegos metanarrativos de segundo orden y tono metafísico afín a "El jardín de senderos que se bifurcan".',
  },
  {
    id: 'biblioteca-babel',
    title: 'La biblioteca de Babel & Otras Variaciones',
    author: 'Alberto Manguel (2006)',
    affinity: 94,
    tag: 'Filosofía & Ficción',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDX20ENg6xmcfNurEXrafxqohoHBeMn2HrFoNiMyQemwD6trqWYh7bjIBU35G2hSdWzHIUv173saCFgxqsAvXMTGiI_vilWdR6hQfR_dNUe1g5pT-Hf5Y0_iRgHHgH5gPJOyWsBA7SjnmxUe8MRe6UbNv3ujWxUvQPkMpEDffbpxmLP2STE8rhFAWGzXTwmFbmNGBaLR45S_f4gayJ796HRDLVZdI9yRvjc_Hv3uwBTlI89KCE6Katu',
    analysis:
      'Despliega la ontología del libro infinito y la relación entre espacio físico y memoria textual, abordando la misma poética borgeana.',
  },
  {
    id: 'ciudad-ciudad',
    title: 'La ciudad y la ciudad',
    author: 'China Miéville (2009)',
    affinity: 89,
    tag: 'Especulativo',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfXVH_rz5uQXCJPjuNddZzhNbCWbh0tmcIqxpUuh9kJUEzI0WCmZANkL6HT_59mcIAf3hsXYYFuzhpNuS7GG4yU2zn_1mcBuEAsMk3NHq2j6Ps8d8oGzEzBzX5C6fdYsQ3hOWFc0e26UO6iF-iJeWXmg5X5wu_AqTDhxfxC-mtDd6VHyx0AhAWa0lzADJdLlqokA0ieXoMFisxKOdPxFxLBxMtfIl1FPVNgEax6FyfMtZPhwHf_iGq',
    analysis:
      'Coincidencia por fractura de fronteras perceptivas y realidades superpuestas, explorando paradojas espaciales con rigor detectivesco.',
  },
]

export const communityPicks = [
  {
    id: 'pedro-paramo',
    title: 'Pedro Páramo',
    author: 'Juan Rulfo · Edición Conmemorativa',
    rating: 4.9,
    reviews: 142,
    quote:
      'Un viaje espectral insuperable. La voz coral de los muertos redefine la memoria latinoamericana.',
    reviewer: 'Dr. M. Sotomayor',
    reviewerRole: 'Docente de Literatura',
    tags: ['Fantasmas', 'Realismo Mágico'],
    loans: 91,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5zb7Pf0CcedKIjcPKgMD7N1HNO-kI2_3AXCasuU4oQ4e369c7ZIe8NVGGv8eMW9j5RGNh60MpCbdF_jty6xXxo0v3ASZrXpu8BARFQQPdy4c4iqDI1fg4KkvkOZG4lQfBM_qee4mvFs98u34yQYfcCBuK4WhLHGMjLFQmBcukOjE9gG2q9N8maP00qDmt73HzR9TfomO320u90-cjB96aat5f6Bf3Fyb37u-MYebcW6okZn_CsYCC',
  },
  {
    id: 'godel-escher-bach',
    title: 'Gödel, Escher, Bach',
    author: 'Douglas Hofstadter · Tratado Fundamental',
    rating: 4.8,
    reviews: 98,
    quote:
      'Una odisea matemática y musical que expande los límites de lo que entendemos por conciencia.',
    reviewer: 'Clara Vega',
    reviewerRole: 'Investigadora en Computación',
    tags: ['Semiótica', 'Lógica'],
    loans: 68,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjsjTU3wfV7zRqEz9Pr_lTrDlYEK6GpvHnQhSgTuvTOvILLfZVRuHg0zRRznMDxaKCVpM-ixcNaiR2bdrOQrWyjyMsK1OPBPBxKnbE9gRuy61H-agRvFj2cYiXdYOEQcKDFzojruwtSu5Wi3jb7pskpm3FBLzxx50XFUA0W_xzLGx_7A8_ksxCcOFDDBKXJ0GnBsEhre_Hh2LO9u9poByfmAOzMCeVcnnbNJLlT5c3xs_6iyJ7y5_C',
  },
]
