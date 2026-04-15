'use client'

import { useState } from 'react'
import StepTemplate from '@/components/wizard/StepTemplate'
import StepBlocks from '@/components/wizard/StepBlocks'
import StepData, { type StepDataValues } from '@/components/wizard/StepData'
import StepPreview, { type DomainSelection } from '@/components/wizard/StepPreview'
import type { TemplateName } from '@/components/templates/themes'
import type { BlockName } from '@/components/templates/renderTemplate'
import type { CopyData } from '@/types/database'

// ─────────────────────────────────────────────
// Barra de progreso
// ─────────────────────────────────────────────

const STEPS = ['Diseño', 'Secciones', 'Tu negocio', 'Preview']

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        {/* Línea de fondo */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
        {/* Línea de progreso */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-indigo-500 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((label, i) => {
          const step = i + 1
          const done = step < current
          const active = step === current
          return (
            <div key={step} className="relative flex flex-col items-center gap-2 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? 'bg-indigo-500 text-white'
                    : active
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : step}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-indigo-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Botones de navegación
// ─────────────────────────────────────────────

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel = 'Siguiente →',
  nextDisabled = false,
}: {
  step: number
  onBack: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        ← {step === 1 ? 'Volver al inicio' : 'Atrás'}
      </button>
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            nextDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
          }`}
        >
          {nextLabel}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Wizard principal
// ─────────────────────────────────────────────

export default function CrearPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1
  const [template, setTemplate] = useState<TemplateName>('minimal')
  const [accentColor, setAccentColor] = useState('#534AB7')

  // Step 2
  const [activeBlocks, setActiveBlocks] = useState<BlockName[]>([
    'hero', 'services', 'about', 'testimonials', 'contact',
  ])

  // Step 3
  const [dataValues, setDataValues] = useState<StepDataValues>({
    bizName: '',
    rubro: '',
    desc: '',
    cta: 'Contactanos',
    phone: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Step 4
  const [copy, setCopy] = useState<CopyData | null>(null)
  const [domain, setDomain] = useState<DomainSelection | null>(null)
  const [isPaying, setIsPaying] = useState(false)

  // ── Navegación ──

  function goBack() {
    if (step === 1) { window.location.href = '/' ; return }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  function goNext() {
    setStep((s) => (s + 1) as 1 | 2 | 3 | 4)
  }

  // ── Generación de copy ──

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bizName: dataValues.bizName,
          rubro: dataValues.rubro,
          desc: dataValues.desc,
          cta: dataValues.cta || 'Contactanos',
          phone: dataValues.phone,
          activeBlocks,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setGenerateError(json.error ?? 'Ocurrió un error. Intentá de nuevo.')
        return
      }

      setCopy(json.copy as CopyData)
      setStep(4)
    } catch {
      setGenerateError('No se pudo conectar. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Pago ──

  async function handlePay() {
    if (!domain || !copy) return
    setIsPaying(true)

    try {
      // TODO: crear orden en Supabase y redirigir a Mercado Pago
      // Por ahora simula la navegación al paso de pago
      const params = new URLSearchParams({
        bizName: dataValues.bizName,
        domainType: domain.domainType,
        domainValue: domain.domainValue,
        price: String(domain.domainType === 'own' ? 250000 : 300000),
      })
      window.location.href = `/pago?${params.toString()}`
    } catch {
      setIsPaying(false)
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="font-bold text-indigo-600 text-lg tracking-tight">
            VolonteDev
          </a>
          <span className="text-xs text-gray-400">Paso {step} de {STEPS.length}</span>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <ProgressBar current={step} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">

          {step === 1 && (
            <>
              <StepTemplate
                template={template}
                accentColor={accentColor}
                onChange={(t, c) => { setTemplate(t); setAccentColor(c) }}
              />
              <NavButtons step={1} onBack={goBack} onNext={goNext} nextLabel="Elegir secciones →" />
            </>
          )}

          {step === 2 && (
            <>
              <StepBlocks activeBlocks={activeBlocks} onChange={setActiveBlocks} />
              <NavButtons
                step={2}
                onBack={goBack}
                onNext={goNext}
                nextLabel="Ingresar datos →"
                nextDisabled={activeBlocks.length === 0}
              />
            </>
          )}

          {step === 3 && (
            <>
              <StepData
                values={dataValues}
                onChange={setDataValues}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                error={generateError}
              />
              <NavButtons step={3} onBack={goBack} />
            </>
          )}

          {step === 4 && copy && (
            <>
              <StepPreview
                template={template}
                activeBlocks={activeBlocks}
                copy={copy}
                accentColor={accentColor}
                bizName={dataValues.bizName}
                phone={dataValues.phone}
                domain={domain}
                onDomainChange={setDomain}
                onPay={handlePay}
                isPaying={isPaying}
              />
              <NavButtons step={4} onBack={() => setStep(3)} />
            </>
          )}

        </div>
      </main>
    </div>
  )
}
