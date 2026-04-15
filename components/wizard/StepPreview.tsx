'use client'

import { useRef, useEffect, useState } from 'react'
import { renderTemplate } from '@/components/templates/renderTemplate'
import type { TemplateName } from '@/components/templates/themes'
import type { BlockName } from '@/components/templates/renderTemplate'
import type { CopyData, DomainType } from '@/types/database'

// Lógica de precio según tipo de dominio (del CLAUDE.md)
function calcularPrecio(domainType: DomainType | null): number {
  if (domainType === 'own') return 250000
  return 300000
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

// ─────────────────────────────────────────────
// Selector de dominio
// ─────────────────────────────────────────────

interface DomainOptionProps {
  selected: boolean
  onClick: () => void
  title: string
  desc: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
}

function DomainOption({ selected, onClick, title, desc, badge, badgeColor, children }: DomainOptionProps) {
  return (
    <label
      onClick={onClick}
      className={`relative block cursor-pointer rounded-xl border-2 p-4 transition-all ${
        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            {badge && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </label>
  )
}

// ─────────────────────────────────────────────
// Props del step
// ─────────────────────────────────────────────

export interface DomainSelection {
  domainType: DomainType
  domainValue: string
}

interface StepPreviewProps {
  template: TemplateName
  activeBlocks: BlockName[]
  copy: CopyData
  accentColor: string
  bizName: string
  phone?: string
  domain: DomainSelection | null
  onDomainChange: (d: DomainSelection) => void
  onPay: () => void
  isPaying: boolean
}

export default function StepPreview({
  template,
  activeBlocks,
  copy,
  accentColor,
  bizName,
  phone,
  domain,
  onDomainChange,
  onPay,
  isPaying,
}: StepPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.45)

  // Calcular escala dinámica según el ancho disponible
  useEffect(() => {
    function updateScale() {
      if (!wrapperRef.current) return
      const availableWidth = wrapperRef.current.offsetWidth
      setScale(availableWidth / 1280)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const precio = calcularPrecio(domain?.domainType ?? null)
  const canPay = domain !== null && domain.domainValue.trim().length > 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tu landing está lista 🎉</h2>
        <p className="text-sm text-gray-500">Revisá el preview y elegí cómo querés publicarla.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

        {/* ── Preview ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vista previa</p>

          {/* Browser chrome */}
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-xl">
            {/* Barra de browser */}
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono mx-2">
                {domain?.domainType === 'subdomain' && domain.domainValue
                  ? `${domain.domainValue}.volontedev.com`
                  : domain?.domainType === 'own' && domain.domainValue
                  ? domain.domainValue
                  : domain?.domainType === 'new' && domain.domainValue
                  ? domain.domainValue
                  : 'tu-sitio.volontedev.com'}
              </div>
            </div>

            {/* Viewport del preview */}
            <div
              ref={wrapperRef}
              className="relative overflow-hidden bg-white"
              style={{ height: Math.round(1280 * scale * 0.65) }}
            >
              <div
                ref={previewRef}
                className="absolute top-0 left-0 w-[1280px] origin-top-left pointer-events-none"
                style={{ transform: `scale(${scale})` }}
              >
                {renderTemplate({
                  template,
                  activeBlocks,
                  copy,
                  accentColor,
                  bizName,
                  phone,
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">
            Podés editar todos los textos antes de publicar
          </p>
        </div>

        {/* ── Panel derecho: dominio + precio + pago ── */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Selección de dominio */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">¿Cómo querés publicar tu sitio?</h3>

            {/* Opción A: Subdominio */}
            <DomainOption
              selected={domain?.domainType === 'subdomain'}
              onClick={() => onDomainChange({ domainType: 'subdomain', domainValue: domain?.domainType === 'subdomain' ? domain.domainValue : '' })}
              title="Subdominio gratuito"
              desc="Incluido sin costo adicional"
            >
              {domain?.domainType === 'subdomain' && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={domain.domainValue}
                    onChange={(e) => onDomainChange({ domainType: 'subdomain', domainValue: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="mi-negocio"
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">.volontedev.com</span>
                </div>
              )}
            </DomainOption>

            {/* Opción B: Dominio propio */}
            <DomainOption
              selected={domain?.domainType === 'own'}
              onClick={() => onDomainChange({ domainType: 'own', domainValue: domain?.domainType === 'own' ? domain.domainValue : '' })}
              title="Ya tengo un dominio"
              desc="Solo hay que apuntarlo a nuestro servidor"
              badge="-$50.000"
              badgeColor="#16A34A"
            >
              {domain?.domainType === 'own' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={domain.domainValue}
                    onChange={(e) => onDomainChange({ domainType: 'own', domainValue: e.target.value.toLowerCase().trim() })}
                    placeholder="mi-negocio.com.ar"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    ✓ Después del pago te enviamos las instrucciones DNS para apuntarlo.
                  </p>
                </div>
              )}
            </DomainOption>

            {/* Opción C: Dominio nuevo */}
            <DomainOption
              selected={domain?.domainType === 'new'}
              onClick={() => onDomainChange({ domainType: 'new', domainValue: domain?.domainType === 'new' ? domain.domainValue : '' })}
              title="Quiero un dominio nuevo"
              desc="Cotizamos y gestionamos el dominio por vos"
            >
              {domain?.domainType === 'new' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={domain.domainValue}
                    onChange={(e) => onDomainChange({ domainType: 'new', domainValue: e.target.value.toLowerCase().trim() })}
                    placeholder="mi-negocio.com.ar"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                    ℹ️ Vamos a cotizarte el dominio y acordar el precio antes de comprarlo. Te contactamos por WhatsApp.
                  </p>
                </div>
              )}
            </DomainOption>
          </div>

          {/* Resumen de precio */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sitio web completo</span>
                <span>{formatARS(300000)}</span>
              </div>
              {domain?.domainType === 'own' && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Descuento dominio propio</span>
                  <span>−{formatARS(50000)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Primera cuota</span>
                <span className="text-lg" style={{ color: '#534AB7' }}>{formatARS(precio)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Mantenimiento mensual</span>
                <span>{formatARS(50000)}/mes</span>
              </div>
            </div>

            {/* Aviso obligatorio de condiciones de baja */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              ⚠️ <strong>Importante:</strong> el mantenimiento mensual de {formatARS(50000)} es obligatorio
              para mantener tu sitio en línea. Si no se abona dentro de los 5 días hábiles del vencimiento,
              el sitio será dado de baja hasta regularizar el pago.
            </div>

            {/* Botón de pago */}
            <button
              onClick={onPay}
              disabled={!canPay || isPaying}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                canPay && !isPaying
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isPaying ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirigiendo…
                </>
              ) : (
                <>💳 Pagar {canPay ? formatARS(precio) : ''}</>
              )}
            </button>

            {!canPay && (
              <p className="text-xs text-center text-gray-400">
                Elegí una opción de dominio para continuar
              </p>
            )}

            <p className="text-xs text-center text-gray-400">
              Pago seguro con Mercado Pago · Podés cancelar cuando quieras
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
