export type TemplateName = 'minimal' | 'bold' | 'elegant' | 'dark' | 'warm' | 'corporate'

export interface Theme {
  // Página y contenedor
  page: string
  container: string
  // Secciones (alternadas para variedad visual)
  sectionA: string
  sectionB: string
  sectionPad: string
  // Tipografía
  h1: string
  h2: string
  h3: string
  body: string
  muted: string
  // Componentes
  card: string
  badge: string
  divider: string
  radius: string
  // Botón (color de fondo viene de accentColor inline)
  btn: string
  // Input de formulario
  input: string
  // Hero
  heroLayout: 'centered' | 'left'
  heroBg: string
  heroH1Extra: string
}

export const themes: Record<TemplateName, Theme> = {
  // ─── MINIMAL ────────────────────────────────────────────────────────────────
  // Blanco, mucho aire, tipografía limpia, sin ornamentos
  minimal: {
    page: 'bg-white text-gray-900 font-sans antialiased',
    container: 'max-w-5xl mx-auto px-6',
    sectionA: 'bg-white',
    sectionB: 'bg-gray-50',
    sectionPad: 'py-20',
    h1: 'text-4xl md:text-6xl font-bold tracking-tight text-gray-900',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight text-gray-900',
    h3: 'text-lg font-semibold text-gray-900',
    body: 'text-base text-gray-700 leading-relaxed',
    muted: 'text-sm text-gray-500',
    card: 'bg-white border border-gray-200 rounded-xl p-6',
    badge: 'inline-block text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600',
    divider: 'border-t border-gray-100 my-12',
    radius: 'rounded-xl',
    btn: 'inline-block px-8 py-3 rounded-full text-white font-semibold text-base transition-opacity hover:opacity-90',
    input: 'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300',
    heroLayout: 'centered',
    heroBg: 'bg-white',
    heroH1Extra: '',
  },

  // ─── BOLD ───────────────────────────────────────────────────────────────────
  // Alto contraste, tipografía grande, secciones oscuras
  bold: {
    page: 'bg-white text-gray-900 font-sans antialiased',
    container: 'max-w-6xl mx-auto px-6',
    sectionA: 'bg-white',
    sectionB: 'bg-gray-950 text-white',
    sectionPad: 'py-24',
    h1: 'text-5xl md:text-7xl font-extrabold tracking-tight leading-none text-white',
    h2: 'text-4xl md:text-5xl font-extrabold tracking-tight',
    h3: 'text-xl font-bold',
    body: 'text-base text-gray-300 leading-relaxed',
    muted: 'text-sm text-gray-400',
    card: 'bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm',
    badge: 'inline-block text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white uppercase tracking-widest',
    divider: 'border-t border-white/10 my-12',
    radius: 'rounded-2xl',
    btn: 'inline-block px-10 py-4 rounded-full text-white font-bold text-lg tracking-wide transition-transform hover:scale-105',
    input: 'w-full border border-white/20 bg-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20',
    heroLayout: 'centered',
    heroBg: 'bg-gray-950',
    heroH1Extra: 'text-white',
  },

  // ─── ELEGANT ────────────────────────────────────────────────────────────────
  // Cream, serif, refinado, espaciado amplio
  elegant: {
    page: 'bg-stone-50 text-stone-800 font-serif antialiased',
    container: 'max-w-4xl mx-auto px-8',
    sectionA: 'bg-stone-50',
    sectionB: 'bg-stone-100',
    sectionPad: 'py-24',
    h1: 'text-4xl md:text-6xl font-bold tracking-tight text-stone-900 font-serif',
    h2: 'text-3xl md:text-4xl font-bold tracking-tight text-stone-900 font-serif',
    h3: 'text-xl font-semibold text-stone-800 font-serif',
    body: 'text-base text-stone-600 leading-loose',
    muted: 'text-sm text-stone-400',
    card: 'bg-white border border-stone-200 rounded-sm p-8 shadow-sm',
    badge: 'inline-block text-xs font-medium px-4 py-1.5 rounded-sm border border-stone-300 text-stone-500 uppercase tracking-widest',
    divider: 'border-t border-stone-200 my-14',
    radius: 'rounded-sm',
    btn: 'inline-block px-10 py-3.5 rounded-sm text-white font-medium tracking-widest uppercase text-sm transition-opacity hover:opacity-80',
    input: 'w-full border border-stone-300 rounded-sm px-4 py-3 text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400',
    heroLayout: 'centered',
    heroBg: 'bg-stone-900',
    heroH1Extra: 'text-white',
  },

  // ─── DARK ───────────────────────────────────────────────────────────────────
  // Todo oscuro, acento luminoso, moderno
  dark: {
    page: 'bg-zinc-900 text-zinc-100 font-sans antialiased',
    container: 'max-w-5xl mx-auto px-6',
    sectionA: 'bg-zinc-900',
    sectionB: 'bg-zinc-800',
    sectionPad: 'py-24',
    h1: 'text-5xl md:text-6xl font-bold tracking-tight text-white',
    h2: 'text-3xl md:text-4xl font-bold text-white',
    h3: 'text-lg font-semibold text-zinc-100',
    body: 'text-base text-zinc-400 leading-relaxed',
    muted: 'text-sm text-zinc-500',
    card: 'bg-zinc-800 border border-zinc-700 rounded-2xl p-6',
    badge: 'inline-block text-xs font-medium px-3 py-1 rounded-full bg-zinc-700 text-zinc-300',
    divider: 'border-t border-zinc-700 my-12',
    radius: 'rounded-2xl',
    btn: 'inline-block px-8 py-3.5 rounded-full text-white font-semibold transition-all hover:brightness-110 shadow-lg',
    input: 'w-full border border-zinc-700 bg-zinc-800 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600',
    heroLayout: 'centered',
    heroBg: 'bg-zinc-900',
    heroH1Extra: '',
  },

  // ─── WARM ───────────────────────────────────────────────────────────────────
  // Tonos cálidos, bordes redondeados, amigable
  warm: {
    page: 'bg-orange-50 text-orange-950 font-sans antialiased',
    container: 'max-w-5xl mx-auto px-6',
    sectionA: 'bg-orange-50',
    sectionB: 'bg-amber-100',
    sectionPad: 'py-20',
    h1: 'text-4xl md:text-5xl font-bold tracking-tight text-orange-950',
    h2: 'text-3xl md:text-4xl font-bold text-orange-900',
    h3: 'text-lg font-semibold text-orange-900',
    body: 'text-base text-orange-800 leading-relaxed',
    muted: 'text-sm text-orange-600',
    card: 'bg-white border border-orange-200 rounded-3xl p-6 shadow-sm',
    badge: 'inline-block text-xs font-semibold px-4 py-1.5 rounded-full bg-orange-100 text-orange-700',
    divider: 'border-t border-orange-200 my-12',
    radius: 'rounded-3xl',
    btn: 'inline-block px-8 py-3.5 rounded-full text-white font-bold transition-transform hover:scale-105 shadow-md',
    input: 'w-full border border-orange-200 bg-white rounded-2xl px-4 py-3 text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-300',
    heroLayout: 'left',
    heroBg: 'bg-gradient-to-br from-orange-100 to-amber-200',
    heroH1Extra: 'text-orange-950',
  },

  // ─── CORPORATE ──────────────────────────────────────────────────────────────
  // Azules, estructurado, profesional
  corporate: {
    page: 'bg-white text-slate-800 font-sans antialiased',
    container: 'max-w-6xl mx-auto px-6',
    sectionA: 'bg-white',
    sectionB: 'bg-slate-50',
    sectionPad: 'py-20',
    h1: 'text-4xl md:text-5xl font-bold tracking-tight text-slate-900',
    h2: 'text-3xl md:text-4xl font-bold text-slate-900',
    h3: 'text-base font-bold text-slate-900 uppercase tracking-wide',
    body: 'text-base text-slate-600 leading-relaxed',
    muted: 'text-sm text-slate-400',
    card: 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm',
    badge: 'inline-block text-xs font-semibold px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100',
    divider: 'border-t border-slate-200 my-12',
    radius: 'rounded-lg',
    btn: 'inline-block px-8 py-3 rounded-lg text-white font-semibold tracking-wide transition-opacity hover:opacity-90',
    input: 'w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300',
    heroLayout: 'left',
    heroBg: 'bg-gradient-to-r from-slate-900 to-blue-950',
    heroH1Extra: 'text-white',
  },
}
