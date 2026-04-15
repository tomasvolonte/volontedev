import type { Theme } from '../themes'
import type { CopyData } from '@/types/database'

interface ServicesBlockProps {
  copy: CopyData
  theme: Theme
  accentColor: string
}

export default function ServicesBlock({ copy, theme, accentColor }: ServicesBlockProps) {
  return (
    <section id="servicios" className={`${theme.sectionB} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Nuestros servicios</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {copy.services.map((service, i) => (
            <div key={i} className={theme.card}>
              <div
                className="text-4xl mb-4 w-14 h-14 flex items-center justify-center rounded-xl text-white text-2xl"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <span style={{ color: accentColor }}>{service.icon}</span>
              </div>
              <h3 className={`${theme.h3} mb-2`}>{service.title}</h3>
              <p className={theme.body}>{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
