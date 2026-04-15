'use client'

const RUBROS = [
  'Gastronomía / Restaurante',
  'Salud y Bienestar',
  'Belleza / Estética / Peluquería',
  'Educación / Academia / Clases',
  'Construcción / Reformas',
  'Tecnología / Informática',
  'Legal / Asesoría / Contabilidad',
  'Ropa / Moda / Accesorios',
  'Fotografía / Video / Diseño',
  'Deportes / Fitness / Yoga',
  'Inmobiliaria / Alquileres',
  'Veterinaria / Mascotas',
  'Turismo / Alojamiento',
  'Logística / Transporte',
  'Comercio / Tienda',
  'Otro',
]

export interface StepDataValues {
  bizName: string
  rubro: string
  desc: string
  cta: string
  phone: string
}

interface StepDataProps {
  values: StepDataValues
  onChange: (values: StepDataValues) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
}

export default function StepData({ values, onChange, onGenerate, isGenerating, error }: StepDataProps) {
  function set(field: keyof StepDataValues, value: string) {
    onChange({ ...values, [field]: value })
  }

  const canGenerate =
    values.bizName.trim().length > 0 &&
    values.rubro.length > 0 &&
    values.desc.trim().length >= 10

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Contanos sobre tu negocio</h2>
        <p className="text-sm text-gray-500">
          Con esta información la IA va a generar textos persuasivos en español argentino.
        </p>
      </div>

      <div className="space-y-5">
        {/* Nombre del negocio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nombre del negocio <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.bizName}
            onChange={(e) => set('bizName', e.target.value)}
            placeholder="Ej: Panadería Don Carlos"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
          />
        </div>

        {/* Rubro */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Rubro <span className="text-red-500">*</span>
          </label>
          <select
            value={values.rubro}
            onChange={(e) => set('rubro', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm bg-white"
          >
            <option value="">Seleccioná un rubro…</option>
            {RUBROS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Descripción del negocio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={values.desc}
            onChange={(e) => set('desc', e.target.value)}
            rows={4}
            placeholder="Contanos qué hacés, dónde estás, qué te diferencia... (mínimo 10 caracteres)"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            {values.desc.length} caracteres
            {values.desc.length < 50 && values.desc.length > 0 && (
              <span className="text-amber-500 ml-2">Cuantos más detalles, mejor el resultado</span>
            )}
          </p>
        </div>

        {/* CTA */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Texto del botón principal
          </label>
          <input
            type="text"
            value={values.cta}
            onChange={(e) => set('cta', e.target.value)}
            placeholder="Ej: Pedir turno, Consultar precio, Ver menú"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            WhatsApp de contacto
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">+</span>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="5491112345678"
              className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Código de país + código de área + número. Sin espacios ni guiones.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Botón generar */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 ${
          canGenerate && !isGenerating
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando con IA…
          </>
        ) : (
          <>
            <span>✨</span>
            Generar mi landing con IA
          </>
        )}
      </button>

      {!canGenerate && (
        <p className="text-xs text-center text-gray-400">
          Completá nombre, rubro y descripción para continuar
        </p>
      )}
    </div>
  )
}
