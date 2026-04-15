'use client'

import type { TemplateName } from '@/components/templates/themes'

const TEMPLATES: { name: TemplateName; label: string; desc: string; bg: string; text: string }[] = [
  { name: 'minimal', label: 'Minimal',    desc: 'Limpio y moderno',       bg: '#ffffff', text: '#111111' },
  { name: 'bold',    label: 'Bold',       desc: 'Impactante y oscuro',    bg: '#030712', text: '#ffffff' },
  { name: 'elegant', label: 'Elegant',    desc: 'Refinado y sofisticado', bg: '#f5f0eb', text: '#3b2f1e' },
  { name: 'dark',    label: 'Dark',       desc: 'Moderno y tecnológico',  bg: '#18181b', text: '#fafafa' },
  { name: 'warm',    label: 'Warm',       desc: 'Cálido y cercano',       bg: '#fff7ed', text: '#431407' },
  { name: 'corporate', label: 'Corporate', desc: 'Serio y profesional',   bg: '#f8fafc', text: '#0f172a' },
]

const ACCENT_PRESETS = [
  '#534AB7', '#2563EB', '#16A34A', '#DC2626',
  '#D97706', '#0891B2', '#9333EA', '#DB2777',
  '#374151', '#065F46',
]

interface StepTemplateProps {
  template: TemplateName
  accentColor: string
  onChange: (template: TemplateName, accentColor: string) => void
}

export default function StepTemplate({ template, accentColor, onChange }: StepTemplateProps) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Elegí el estilo de tu sitio</h2>
        <p className="text-sm text-gray-500">Podés cambiarlo después. El contenido es el mismo en todos.</p>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const selected = template === t.name
          return (
            <button
              key={t.name}
              onClick={() => onChange(t.name, accentColor)}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                selected
                  ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* Mini preview */}
              <div
                className="h-28 flex flex-col justify-between p-3"
                style={{ backgroundColor: t.bg, color: t.text }}
              >
                {/* Nav simulada */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-2 rounded-full opacity-40" style={{ backgroundColor: t.text }} />
                  <div className="w-8 h-2 rounded-full opacity-20" style={{ backgroundColor: accentColor }} />
                </div>
                {/* Headline simulada */}
                <div className="space-y-1.5">
                  <div className="w-3/4 h-3 rounded-full opacity-60" style={{ backgroundColor: t.text }} />
                  <div className="w-1/2 h-2 rounded-full opacity-30" style={{ backgroundColor: t.text }} />
                  <div
                    className="w-20 h-5 rounded-full mt-2 flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    CTA
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Color de acento */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Color de acento</h3>
        <div className="flex flex-wrap items-center gap-3">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => onChange(template, color)}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                accentColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <label className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-500 transition-colors" title="Color personalizado">
            <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">+</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onChange(template, e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
          <span
            className="px-3 py-1 rounded-full text-white text-xs font-mono"
            style={{ backgroundColor: accentColor }}
          >
            {accentColor}
          </span>
        </div>
      </div>
    </div>
  )
}
