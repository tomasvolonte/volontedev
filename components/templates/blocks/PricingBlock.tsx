import type { Theme } from '../themes'

interface PricingBlockProps {
  theme: Theme
  accentColor: string
  bizName: string
  phone?: string
}

const DEFAULT_FEATURES = [
  'Consulta inicial gratuita',
  'Atención personalizada',
  'Presupuesto sin cargo',
  'Garantía de satisfacción',
  'Soporte post-venta',
]

export default function PricingBlock({ theme, accentColor, bizName, phone }: PricingBlockProps) {
  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=Quiero un presupuesto de ${encodeURIComponent(bizName)}`
    : '#contacto'

  return (
    <section id="precios" className={`${theme.sectionB} ${theme.sectionPad}`}>
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Precios y planes</h2>
          <p className={`${theme.body} mt-3 max-w-lg mx-auto`}>
            Trabajamos con presupuestos a medida según tus necesidades
          </p>
        </div>
        <div className="max-w-sm mx-auto">
          <div
            className={`${theme.card} text-center relative overflow-hidden`}
            style={{ borderColor: accentColor, borderWidth: 2 }}
          >
            {/* Badge destacado */}
            <div
              className="absolute top-0 left-0 right-0 py-1.5 text-white text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: accentColor }}
            >
              ★ Más popular
            </div>
            <div className="mt-8">
              <p className={`${theme.muted} mb-1`}>Desde</p>
              <p className="text-5xl font-bold my-2" style={{ color: accentColor }}>
                Consultar
              </p>
              <p className={theme.muted}>Presupuesto personalizado</p>
            </div>
            <hr className={`${theme.divider} my-6`} />
            <ul className="space-y-3 text-left mb-8">
              {DEFAULT_FEATURES.map((f, i) => (
                <li key={i} className={`flex items-center gap-3 ${theme.body}`}>
                  <span className="text-green-500 font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={waLink}
              className={`${theme.btn} w-full text-center block`}
              style={{ backgroundColor: accentColor }}
            >
              Pedir presupuesto
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
