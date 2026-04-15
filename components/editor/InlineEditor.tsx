'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import EditableText from './EditableText'
import { themes } from '@/components/templates/themes'
import type { Theme, TemplateName } from '@/components/templates/themes'
import type { BlockName } from '@/components/templates/renderTemplate'
import type { CopyData, DbLanding, ServiceItem, Testimonial, FaqItem } from '@/types/database'

// ─────────────────────────────────────────────
// Helpers de actualización inmutable
// ─────────────────────────────────────────────

function setField<K extends keyof CopyData>(copy: CopyData, field: K, value: CopyData[K]): CopyData {
  return { ...copy, [field]: value }
}
function setService(copy: CopyData, i: number, field: keyof ServiceItem, value: string): CopyData {
  const services = copy.services.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
  return { ...copy, services }
}
function setTestimonial(copy: CopyData, i: number, field: keyof Testimonial, value: string): CopyData {
  const testimonials = copy.testimonials.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
  return { ...copy, testimonials }
}
function setFaq(copy: CopyData, i: number, field: keyof FaqItem, value: string): CopyData {
  const faq = copy.faq.map((f, idx) => idx === i ? { ...f, [field]: value } : f)
  return { ...copy, faq }
}

// ─────────────────────────────────────────────
// Hook: debounced save
// ─────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function useDebouncedSave(landingId: string, delay = 1500) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (edited_copy: CopyData | null) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('idle')

    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        const res = await fetch(`/api/landings/${landingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edited_copy }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Error desconocido')
        }
        setStatus('saved')
      } catch (err) {
        console.error('[InlineEditor] save error:', err)
        setStatus('error')
      }
    }, delay)
  }, [landingId, delay])

  const saveNow = useCallback(async (edited_copy: CopyData | null) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('saving')
    try {
      const res = await fetch(`/api/landings/${landingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_copy }),
      })
      if (!res.ok) throw new Error()
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [landingId])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { status, save, saveNow }
}

// ─────────────────────────────────────────────
// Barra de herramientas
// ─────────────────────────────────────────────

function Toolbar({
  bizName, status, hasEdits, accentColor, onReset, onSaveNow,
}: {
  bizName: string
  status: SaveStatus
  hasEdits: boolean
  accentColor: string
  onReset: () => void
  onSaveNow: () => void
}) {
  const statusLabel = {
    idle:   null,
    saving: <span className="text-gray-400 text-xs flex items-center gap-1.5"><Spinner />Guardando…</span>,
    saved:  <span className="text-green-600 text-xs font-medium">✓ Guardado</span>,
    error:  <span className="text-red-500 text-xs font-medium">⚠ Error al guardar</span>,
  }[status]

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <a href="/" className="font-bold text-indigo-600 text-base tracking-tight flex-shrink-0">
          VolonteDev
        </a>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{bizName}</span>

        {/* Hint */}
        <span className="hidden md:block text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1 flex-shrink-0">
          ✏️ Hacé clic en cualquier texto para editarlo
        </span>

        <div className="flex-1" />

        {/* Estado de guardado */}
        <div className="flex-shrink-0">{statusLabel}</div>

        {/* Botones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasEdits && (
            <button
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              ↩ Resetear al original
            </button>
          )}
          <button
            onClick={onSaveNow}
            className="text-xs font-semibold text-white rounded-lg px-4 py-1.5 transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Guardar ahora
          </button>
        </div>
      </div>

      {/* Aviso de edición post-publicación */}
      <div className="bg-blue-50 border-t border-blue-100 px-4 py-2 text-xs text-blue-700 text-center hidden md:block">
        Podés editar libremente. Los cambios se guardan automáticamente. Una vez publicado, los cambios se solicitan vía WhatsApp al operador.
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// Secciones editables
// ─────────────────────────────────────────────

function EditableHero({ copy, theme, accentColor, bizName, onUpdate }: {
  copy: CopyData; theme: Theme; accentColor: string; bizName: string
  onUpdate: (field: keyof CopyData, value: string) => void
}) {
  const isLeft = theme.heroLayout === 'left'
  const inner = (
    <div className={`space-y-5 ${isLeft ? '' : 'text-center max-w-2xl mx-auto'}`}>
      <span className={theme.badge}>{bizName}</span>
      <EditableText
        tag="h1"
        value={copy.headline}
        onChange={(v) => onUpdate('headline', v)}
        className={`${theme.h1} ${theme.heroH1Extra} block`}
        placeholder="Tu headline principal"
      />
      <EditableText
        tag="p"
        value={copy.subheadline}
        onChange={(v) => onUpdate('subheadline', v)}
        className={`text-lg opacity-70 block`}
        placeholder="Subheadline…"
      />
      <EditableText
        tag="span"
        value={copy.cta_text}
        onChange={(v) => onUpdate('cta_text', v)}
        className={`${theme.btn} inline-block`}
        style={{ backgroundColor: accentColor }}
        placeholder="Texto del botón"
      />
    </div>
  )

  return (
    <section id="hero" className={`${theme.heroBg} ${theme.sectionPad} group relative`}>
      <SectionLabel label="Hero" />
      <div className={theme.container}>
        {isLeft ? (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {inner}
            <div className="h-72 md:h-96 rounded-2xl opacity-20" style={{ backgroundColor: accentColor }} />
          </div>
        ) : inner}
      </div>
    </section>
  )
}

function EditableServices({ copy, theme, accentColor, onUpdate }: {
  copy: CopyData; theme: Theme; accentColor: string
  onUpdate: (i: number, field: keyof ServiceItem, value: string) => void
}) {
  return (
    <section id="servicios" className={`${theme.sectionB} ${theme.sectionPad} group relative`}>
      <SectionLabel label="Servicios" />
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Nuestros servicios</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {copy.services.map((s, i) => (
            <div key={i} className={theme.card}>
              <div className="text-4xl mb-4 w-14 h-14 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accentColor}20` }}>
                <EditableText
                  tag="span"
                  value={s.icon}
                  onChange={(v) => onUpdate(i, 'icon', v)}
                  className="text-2xl"
                  placeholder="🔧"
                />
              </div>
              <EditableText
                tag="h3"
                value={s.title}
                onChange={(v) => onUpdate(i, 'title', v)}
                className={`${theme.h3} mb-2 block`}
                placeholder="Título del servicio"
              />
              <EditableText
                tag="p"
                value={s.desc}
                onChange={(v) => onUpdate(i, 'desc', v)}
                className={`${theme.body} block`}
                multiline
                placeholder="Descripción…"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EditableAbout({ copy, theme, accentColor, bizName, onUpdate }: {
  copy: CopyData; theme: Theme; accentColor: string; bizName: string
  onUpdate: (field: keyof CopyData, value: string) => void
}) {
  return (
    <section id="nosotros" className={`${theme.sectionA} ${theme.sectionPad} group relative`}>
      <SectionLabel label="Nosotros" />
      <div className={theme.container}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="h-72 rounded-2xl flex items-center justify-center opacity-10 order-last md:order-first"
            style={{ backgroundColor: accentColor }}>
            <span className="text-8xl">🏢</span>
          </div>
          <div className="space-y-6">
            <span className={theme.badge}>Sobre nosotros</span>
            <h2 className={theme.h2}>{bizName}</h2>
            <EditableText
              tag="p"
              value={copy.about}
              onChange={(v) => onUpdate('about', v)}
              className={`${theme.body} text-lg block`}
              multiline
              placeholder="Descripción del negocio…"
            />
            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function EditableTestimonials({ copy, theme, accentColor, onUpdate }: {
  copy: CopyData; theme: Theme; accentColor: string
  onUpdate: (i: number, field: keyof Testimonial, value: string) => void
}) {
  return (
    <section id="testimonios" className={`${theme.sectionB} ${theme.sectionPad} group relative`}>
      <SectionLabel label="Testimonios" />
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {copy.testimonials.map((t, i) => (
            <div key={i} className={`${theme.card} relative`}>
              <div className="text-5xl font-serif leading-none mb-4 opacity-30" style={{ color: accentColor }}>&ldquo;</div>
              <EditableText
                tag="p"
                value={t.text}
                onChange={(v) => onUpdate(i, 'text', v)}
                className={`${theme.body} italic mb-6 block`}
                multiline
                placeholder="Testimonio del cliente…"
              />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: accentColor }}>
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <EditableText
                  tag="span"
                  value={t.name}
                  onChange={(v) => onUpdate(i, 'name', v)}
                  className={`${theme.h3} text-sm`}
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EditableFaq({ copy, theme, accentColor, onUpdate }: {
  copy: CopyData; theme: Theme; accentColor: string
  onUpdate: (i: number, field: keyof FaqItem, value: string) => void
}) {
  return (
    <section id="faq" className={`${theme.sectionA} ${theme.sectionPad} group relative`}>
      <SectionLabel label="FAQ" />
      <div className={theme.container}>
        <div className="text-center mb-12">
          <h2 className={theme.h2}>Preguntas frecuentes</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {copy.faq.map((item, i) => (
            <div key={i} className={`${theme.card}`}>
              <EditableText
                tag="p"
                value={item.q}
                onChange={(v) => onUpdate(i, 'q', v)}
                className={`${theme.h3} mb-3 block`}
                placeholder="Pregunta…"
              />
              <EditableText
                tag="p"
                value={item.a}
                onChange={(v) => onUpdate(i, 'a', v)}
                className={`${theme.body} block`}
                multiline
                placeholder="Respuesta…"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Secciones sin copy editable (Gallery, Pricing, Contact) — reutilizamos los bloques existentes
// con un wrapper que los marca visualmente como no editables en esta versión
function NonEditableSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <SectionLabel label={`${label} (no editable en el editor)`} color="bg-gray-400" />
      {children}
    </div>
  )
}

// Label flotante de sección
function SectionLabel({ label, color = 'bg-indigo-500' }: { label: string; color?: string }) {
  return (
    <div className={`absolute top-2 left-2 z-10 ${color} text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
      {label}
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

interface InlineEditorProps {
  landing: DbLanding
}

export default function InlineEditor({ landing }: InlineEditorProps) {
  const originalCopy = landing.copy_data!
  const [editedCopy, setEditedCopy] = useState<CopyData>(
    landing.edited_copy ?? originalCopy
  )

  const { status, save, saveNow } = useDebouncedSave(landing.id)

  const theme = themes[landing.template as TemplateName]
  const accentColor = landing.accent_color ?? '#534AB7'
  const bizName = landing.business_name
  const activeBlocks = (landing.active_blocks ?? []) as BlockName[]

  // Compara si hay ediciones respecto al original
  const hasEdits = JSON.stringify(editedCopy) !== JSON.stringify(originalCopy)

  // Actualiza un campo y dispara guardado debounced
  function update(newCopy: CopyData) {
    setEditedCopy(newCopy)
    save(newCopy)
  }

  // Reset al original
  async function handleReset() {
    if (!confirm('¿Resetear todos los textos al original generado por IA?')) return
    setEditedCopy(originalCopy)
    await saveNow(null) // null = borra edited_copy en DB
  }

  // Importar los bloques no-editables solo cuando se necesiten
  const GalleryBlock = require('@/components/templates/blocks/GalleryBlock').default
  const PricingBlock = require('@/components/templates/blocks/PricingBlock').default
  const ContactBlock = require('@/components/templates/blocks/ContactBlock').default

  return (
    <div className={theme.page}>
      <Toolbar
        bizName={bizName}
        status={status}
        hasEdits={hasEdits}
        accentColor={accentColor}
        onReset={handleReset}
        onSaveNow={() => saveNow(hasEdits ? editedCopy : null)}
      />

      {/* Navbar del template (no editable) */}
      <nav className={`${theme.sectionA} border-b py-0`}>
        <div className={`${theme.container} flex items-center justify-between h-16`}>
          <span className="font-bold text-lg" style={{ color: accentColor }}>{bizName}</span>
          <div className="hidden md:flex gap-6">
            {activeBlocks.filter(b => b !== 'hero').map((b) => (
              <a key={b} href={`#${b}`} className={`${theme.muted} text-sm font-medium`}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </a>
            ))}
          </div>
          <span className={`${theme.btn} py-2 px-5 text-sm`} style={{ backgroundColor: accentColor }}>
            Contactar
          </span>
        </div>
      </nav>

      <main>
        {activeBlocks.map((block) => {
          switch (block) {
            case 'hero':
              return (
                <EditableHero
                  key="hero"
                  copy={editedCopy}
                  theme={theme}
                  accentColor={accentColor}
                  bizName={bizName}
                  onUpdate={(field, value) => update(setField(editedCopy, field as keyof CopyData, value as CopyData[keyof CopyData]))}
                />
              )
            case 'services':
              return (
                <EditableServices
                  key="services"
                  copy={editedCopy}
                  theme={theme}
                  accentColor={accentColor}
                  onUpdate={(i, field, value) => update(setService(editedCopy, i, field, value))}
                />
              )
            case 'about':
              return (
                <EditableAbout
                  key="about"
                  copy={editedCopy}
                  theme={theme}
                  accentColor={accentColor}
                  bizName={bizName}
                  onUpdate={(field, value) => update(setField(editedCopy, field as keyof CopyData, value as CopyData[keyof CopyData]))}
                />
              )
            case 'testimonials':
              return (
                <EditableTestimonials
                  key="testimonials"
                  copy={editedCopy}
                  theme={theme}
                  accentColor={accentColor}
                  onUpdate={(i, field, value) => update(setTestimonial(editedCopy, i, field, value))}
                />
              )
            case 'faq':
              return (
                <EditableFaq
                  key="faq"
                  copy={editedCopy}
                  theme={theme}
                  accentColor={accentColor}
                  onUpdate={(i, field, value) => update(setFaq(editedCopy, i, field, value))}
                />
              )
            case 'gallery':
              return (
                <NonEditableSection key="gallery" label="Galería">
                  <GalleryBlock theme={theme} accentColor={accentColor} />
                </NonEditableSection>
              )
            case 'pricing':
              return (
                <NonEditableSection key="pricing" label="Precios">
                  <PricingBlock theme={theme} accentColor={accentColor} bizName={bizName} />
                </NonEditableSection>
              )
            case 'contact':
              return (
                <NonEditableSection key="contact" label="Contacto">
                  <ContactBlock copy={editedCopy} theme={theme} accentColor={accentColor} bizName={bizName} phone={undefined} />
                </NonEditableSection>
              )
            default:
              return null
          }
        })}
      </main>

      {/* Footer */}
      <footer className={`${theme.sectionA} border-t py-8`}>
        <div className={`${theme.container} flex flex-col md:flex-row items-center justify-between gap-4`}>
          <span className="font-semibold" style={{ color: accentColor }}>{bizName}</span>
          <p className={theme.muted}>© {new Date().getFullYear()} {bizName}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
