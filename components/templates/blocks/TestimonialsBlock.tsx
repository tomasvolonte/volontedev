import type { Theme } from '../themes'
import type { CopyData } from '@/types/database'

interface TestimonialsBlockProps {
  copy: CopyData
  theme: Theme
  accentColor: string
}

export default function TestimonialsBlock({ copy, theme, accentColor }: TestimonialsBlockProps) {
  return (
    <section id="testimonios" className={`${theme.sectionB} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {copy.testimonials.map((t, i) => (
            <div key={i} className={`${theme.card} relative`}>
              {/* Comilla decorativa */}
              <div
                className="text-5xl font-serif leading-none mb-4 opacity-30"
                style={{ color: accentColor }}
              >
                &ldquo;
              </div>
              <p className={`${theme.body} italic mb-6`}>{t.text}</p>
              <div className="flex items-center gap-3 mt-auto">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`${theme.h3} text-sm`}>{t.name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, s) => (
                      <span key={s} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
