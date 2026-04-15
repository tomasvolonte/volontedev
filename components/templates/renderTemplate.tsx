import type { TemplateName, Theme } from './themes'
import { themes } from './themes'
import type { CopyData } from '@/types/database'

import HeroBlock from './blocks/HeroBlock'
import ServicesBlock from './blocks/ServicesBlock'
import AboutBlock from './blocks/AboutBlock'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import GalleryBlock from './blocks/GalleryBlock'
import PricingBlock from './blocks/PricingBlock'
import FaqBlock from './blocks/FaqBlock'
import ContactBlock from './blocks/ContactBlock'

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export type BlockName = 'hero' | 'services' | 'about' | 'testimonials' | 'gallery' | 'pricing' | 'faq' | 'contact'

export interface RenderTemplateProps {
  template: TemplateName
  activeBlocks: BlockName[]
  copy: CopyData
  accentColor?: string
  bizName: string
  phone?: string
}

// ─────────────────────────────────────────────
// Navegación (barra superior)
// ─────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockName, string> = {
  hero: 'Inicio',
  services: 'Servicios',
  about: 'Nosotros',
  testimonials: 'Clientes',
  gallery: 'Galería',
  pricing: 'Precios',
  faq: 'FAQ',
  contact: 'Contacto',
}

function Navbar({ bizName, activeBlocks, theme, accentColor }: {
  bizName: string
  activeBlocks: BlockName[]
  theme: Theme
  accentColor: string
}) {
  const navBlocks = activeBlocks.filter((b) => b !== 'hero')

  return (
    <nav className={`sticky top-0 z-50 ${theme.sectionA} border-b ${theme.divider.replace('my-12', '')} bg-opacity-90 backdrop-blur-md`}>
      <div className={`${theme.container} flex items-center justify-between h-16`}>
        <span className="font-bold text-lg" style={{ color: accentColor }}>
          {bizName}
        </span>
        <div className="hidden md:flex items-center gap-6">
          {navBlocks.map((b) => (
            <a
              key={b}
              href={`#${b === 'services' ? 'servicios' : b === 'about' ? 'nosotros' : b === 'testimonials' ? 'testimonios' : b === 'gallery' ? 'galeria' : b === 'pricing' ? 'precios' : b === 'faq' ? 'faq' : 'contacto'}`}
              className={`${theme.muted} hover:opacity-100 text-sm font-medium transition-opacity`}
            >
              {BLOCK_LABELS[b]}
            </a>
          ))}
        </div>
        <a
          href="#contacto"
          className={`${theme.btn} py-2 px-5 text-sm`}
          style={{ backgroundColor: accentColor }}
        >
          Contactar
        </a>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

function Footer({ bizName, theme, accentColor }: { bizName: string; theme: Theme; accentColor: string }) {
  return (
    <footer className={`${theme.sectionA} border-t py-8`}>
      <div className={`${theme.container} flex flex-col md:flex-row items-center justify-between gap-4`}>
        <span className="font-semibold" style={{ color: accentColor }}>{bizName}</span>
        <p className={theme.muted}>
          © {new Date().getFullYear()} {bizName}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────
// Render de bloque individual
// ─────────────────────────────────────────────

function renderBlock(
  block: BlockName,
  props: { copy: CopyData; theme: Theme; accentColor: string; bizName: string; phone?: string }
): React.ReactNode {
  const { copy, theme, accentColor, bizName, phone } = props
  switch (block) {
    case 'hero':
      return <HeroBlock key="hero" copy={copy} theme={theme} accentColor={accentColor} bizName={bizName} phone={phone} />
    case 'services':
      return <ServicesBlock key="services" copy={copy} theme={theme} accentColor={accentColor} />
    case 'about':
      return <AboutBlock key="about" copy={copy} theme={theme} accentColor={accentColor} bizName={bizName} />
    case 'testimonials':
      return <TestimonialsBlock key="testimonials" copy={copy} theme={theme} accentColor={accentColor} />
    case 'gallery':
      return <GalleryBlock key="gallery" theme={theme} accentColor={accentColor} />
    case 'pricing':
      return <PricingBlock key="pricing" theme={theme} accentColor={accentColor} bizName={bizName} phone={phone} />
    case 'faq':
      return <FaqBlock key="faq" copy={copy} theme={theme} accentColor={accentColor} />
    case 'contact':
      return <ContactBlock key="contact" copy={copy} theme={theme} accentColor={accentColor} bizName={bizName} phone={phone} />
  }
}

// ─────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────

export function renderTemplate({
  template,
  activeBlocks,
  copy,
  accentColor = '#534AB7',
  bizName,
  phone,
}: RenderTemplateProps): React.ReactElement {
  const theme = themes[template]
  const blockProps = { copy, theme, accentColor, bizName, phone }

  return (
    <div className={theme.page}>
      <Navbar
        bizName={bizName}
        activeBlocks={activeBlocks}
        theme={theme}
        accentColor={accentColor}
      />
      <main>
        {activeBlocks.map((block) => renderBlock(block, blockProps))}
      </main>
      <Footer bizName={bizName} theme={theme} accentColor={accentColor} />
    </div>
  )
}

// Re-exportar tipos útiles para consumers
export type { TemplateName, Theme }
export { themes }
