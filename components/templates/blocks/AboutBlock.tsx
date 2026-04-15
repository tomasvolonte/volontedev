import type { Theme } from '../themes'
import type { CopyData } from '@/types/database'

interface AboutBlockProps {
  copy: CopyData
  theme: Theme
  accentColor: string
  bizName: string
}

export default function AboutBlock({ copy, theme, accentColor, bizName }: AboutBlockProps) {
  return (
    <section id="nosotros" className={`${theme.sectionA} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Placeholder visual */}
          <div
            className="h-72 rounded-2xl flex items-center justify-center opacity-10 order-last md:order-first"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-8xl">🏢</span>
          </div>
          <div className="space-y-6">
            <span className={theme.badge}>Sobre nosotros</span>
            <h2 className={theme.h2}>{bizName}</h2>
            <p className={`${theme.body} text-lg`}>{copy.about}</p>
            <div
              className="w-16 h-1 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
