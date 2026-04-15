'use client'

import type { BlockName } from '@/components/templates/renderTemplate'

const BLOCKS: { name: BlockName; label: string; desc: string; icon: string; required?: boolean }[] = [
  { name: 'hero',          label: 'Hero',          desc: 'Cabecera principal + CTA',        icon: '🏠', required: true },
  { name: 'services',      label: 'Servicios',      desc: 'Grilla de 4 servicios',           icon: '⚡' },
  { name: 'about',         label: 'Nosotros',       desc: 'Historia y propuesta de valor',   icon: '💬' },
  { name: 'testimonials',  label: 'Testimonios',    desc: '3 reseñas de clientes',           icon: '⭐' },
  { name: 'gallery',       label: 'Galería',        desc: 'Fotos de trabajos o productos',   icon: '🖼️' },
  { name: 'pricing',       label: 'Precios',        desc: 'Tabla de precios o consulta',     icon: '💰' },
  { name: 'faq',           label: 'Preguntas',      desc: 'FAQ con acordeón interactivo',    icon: '❓' },
  { name: 'contact',       label: 'Contacto',       desc: 'Formulario + WhatsApp',           icon: '📩' },
]

interface StepBlocksProps {
  activeBlocks: BlockName[]
  onChange: (blocks: BlockName[]) => void
}

export default function StepBlocks({ activeBlocks, onChange }: StepBlocksProps) {
  function toggle(name: BlockName) {
    if (name === 'hero') return // hero siempre activo
    if (activeBlocks.includes(name)) {
      onChange(activeBlocks.filter((b) => b !== name))
    } else {
      // Mantener orden canónico
      const order: BlockName[] = ['hero', 'services', 'about', 'testimonials', 'gallery', 'pricing', 'faq', 'contact']
      onChange(order.filter((b) => activeBlocks.includes(b) || b === name))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué secciones querés incluir?</h2>
        <p className="text-sm text-gray-500">
          Seleccioná los bloques. Podés reordenarlos después en el editor.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {BLOCKS.map((block) => {
          const active = activeBlocks.includes(block.name)
          return (
            <button
              key={block.name}
              onClick={() => toggle(block.name)}
              disabled={block.required}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              } ${block.required ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-2xl w-9 flex-shrink-0 text-center">{block.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${active ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {block.label}
                  {block.required && (
                    <span className="ml-2 text-xs font-normal text-gray-400">(obligatorio)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">{block.desc}</p>
              </div>
              {/* Checkbox visual */}
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  active ? 'bg-indigo-500' : 'border-2 border-gray-300'
                }`}
              >
                {active && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
          {activeBlocks.length}
        </span>
        secciones seleccionadas
        {activeBlocks.length < 3 && (
          <span className="ml-auto text-amber-600 font-medium">Recomendamos al menos 3</span>
        )}
      </div>
    </div>
  )
}
