import type { Theme } from '../themes'
import type { CopyData } from '@/types/database'

interface HeroBlockProps {
  copy: CopyData
  theme: Theme
  accentColor: string
  bizName: string
  phone?: string
}

export default function HeroBlock({ copy, theme, accentColor, bizName, phone }: HeroBlockProps) {
  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=Hola, me interesa saber más sobre ${encodeURIComponent(bizName)}`
    : '#contacto'

  if (theme.heroLayout === 'left') {
    return (
      <section className={`${theme.heroBg} ${theme.sectionPad}`}>
        <div className={theme.container}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className={theme.badge}>{bizName}</span>
              <h1 className={`${theme.h1} ${theme.heroH1Extra}`}>{copy.headline}</h1>
              <p className="text-lg opacity-80">{copy.subheadline}</p>
              <a
                href={waLink}
                className={theme.btn}
                style={{ backgroundColor: accentColor }}
              >
                {copy.cta_text}
              </a>
            </div>
            {/* Placeholder visual */}
            <div
              className="h-72 md:h-96 rounded-2xl opacity-20"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>
      </section>
    )
  }

  // centered layout
  return (
    <section className={`${theme.heroBg} ${theme.sectionPad}`}>
      <div className={`${theme.container} text-center`}>
        <span className={theme.badge}>{bizName}</span>
        <h1 className={`${theme.h1} ${theme.heroH1Extra} mt-4 mb-4`}>{copy.headline}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto mb-8">{copy.subheadline}</p>
        <a
          href={waLink}
          className={theme.btn}
          style={{ backgroundColor: accentColor }}
        >
          {copy.cta_text}
        </a>
      </div>
    </section>
  )
}
