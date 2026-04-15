/**
 * Helpers de WhatsApp para VolonteDev.
 *
 * Dos modos:
 *   1. Links wa.me  → para abrir en el navegador (wizard, panel admin)
 *   2. enviarMensaje() → para cron jobs / webhooks server-side:
 *        - Si WHATSAPP_API_TOKEN + WHATSAPP_PHONE_ID están seteados, usa
 *          Meta WhatsApp Cloud API (gratuita hasta 1000 conv/mes)
 *        - Si no, loggea el mensaje + link para envío manual
 */

function encodeMsg(text: string): string {
  return encodeURIComponent(text.trim())
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─────────────────────────────────────────────
// Notificación al operador — nuevo pedido confirmado
// ─────────────────────────────────────────────

export interface NuevoPedidoData {
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string
  bizName: string
  montoCobrado: number
  domainType: 'subdomain' | 'own' | 'new'
  domainValue: string
  template: string
  activeBlocks: string[]
  orderId: string
}

export function linkOperadorNuevoPedido(data: NuevoPedidoData): string {
  const operadorWa = process.env.OPERATOR_WA_NUMBER ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://volontedev.com'

  const domainLabel = {
    subdomain: `Subdominio: ${data.domainValue}.volontedev.com`,
    own:  `Dominio propio: ${data.domainValue}\n⚠️ Enviarle instrucciones DNS al cliente`,
    new:  `Dominio nuevo: ${data.domainValue}\n⚠️ Cotizar y coordinar dominio con el cliente antes de publicar`,
  }[data.domainType]

  const msg = `
🆕 Nuevo pedido VolonteDev

👤 Cliente: ${data.clienteNombre}
📱 Tel: ${data.clienteTelefono}
📧 Email: ${data.clienteEmail}
💰 Cobrado: ${formatARS(data.montoCobrado)} ARS

🌐 Dominio:
${domainLabel}

🎨 Template: ${data.template}
📋 Bloques: ${data.activeBlocks.join(', ')}

🔗 Ver pedido:
${appUrl}/admin/pedidos/${data.orderId}
`.trim()

  return `https://wa.me/${operadorWa}?text=${encodeMsg(msg)}`
}

// ─────────────────────────────────────────────
// Notificación al operador — baja por mora
// ─────────────────────────────────────────────

export interface SuspensionData {
  clienteNombre: string
  clienteTelefono: string
  bizName: string
  publishedUrl: string
  diasMora: number
  orderId: string
}

export function linkOperadorSuspension(data: SuspensionData): string {
  const operadorWa = process.env.OPERATOR_WA_NUMBER ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://volontedev.com'

  const msg = `
🔴 BAJA POR MORA — VolonteDev

Cliente: ${data.clienteNombre} (${data.clienteTelefono})
Sitio: ${data.bizName}
URL: ${data.publishedUrl}

Acción requerida: dar de baja el sitio en Hostinger.
Mora: ${data.diasMora} días sin pagar.

🔗 ${appUrl}/admin/pedidos/${data.orderId}
`.trim()

  return `https://wa.me/${operadorWa}?text=${encodeMsg(msg)}`
}

// ─────────────────────────────────────────────
// Notificación al cliente — pago confirmado
// ─────────────────────────────────────────────

export interface PagoConfirmadoData {
  clienteTelefono: string
  bizName: string
  montoCobrado: number
  domainType: 'subdomain' | 'own' | 'new'
  domainValue: string
}

export function linkClientePagoConfirmado(data: PagoConfirmadoData): string {
  const domainMsg = {
    subdomain: `Tu dominio será: ${data.domainValue}.volontedev.com`,
    own: `En breve te enviamos las instrucciones para apuntar tu dominio ${data.domainValue}.`,
    new: `Nos vamos a comunicar para coordinar la compra del dominio ${data.domainValue}.`,
  }[data.domainType]

  const msg = `
✅ ¡Pago confirmado! — VolonteDev

Hola! Recibimos tu pago de ${formatARS(data.montoCobrado)} ARS para el sitio *${data.bizName}*.

${domainMsg}

⚠️ Recordá que el mantenimiento mensual de ${formatARS(50000)} ARS es obligatorio para mantener tu sitio en línea. Si no se abona dentro de los 5 días hábiles del vencimiento, el sitio será dado de baja.

Nuestro equipo está trabajando en publicar tu sitio. Te avisamos cuando esté en línea. 🚀
`.trim()

  return `https://wa.me/${data.clienteTelefono.replace(/\D/g, '')}?text=${encodeMsg(msg)}`
}

// ─────────────────────────────────────────────
// Notificación al cliente — sitio publicado
// ─────────────────────────────────────────────

export function linkClienteSitioPublicado(
  telefono: string,
  bizName: string,
  url: string
): string {
  const msg = `
🎉 ¡Tu sitio está en línea! — VolonteDev

Hola! El sitio *${bizName}* ya está publicado. Podés verlo en:
${url}

Recordá que el mantenimiento mensual de ${formatARS(50000)} ARS se cobra automáticamente. Si querés hacer cambios, escribinos por acá.
`.trim()

  return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeMsg(msg)}`
}

// ─────────────────────────────────────────────
// Notificación al cliente — mora día 1 y día 3
// ─────────────────────────────────────────────

export function linkClienteMora1(telefono: string, bizName: string): string {
  const msg = `⚠️ Hola! Tu sitio *${bizName}* tiene el pago de mantenimiento vencido. Abonalo para evitar la suspensión. Monto: ${formatARS(50000)} ARS`
  return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeMsg(msg)}`
}

export function linkClienteMora2(telefono: string, bizName: string): string {
  const msg = `🚨 Último aviso: tu sitio *${bizName}* se dará de baja en 2 días si no regularizás el pago de ${formatARS(50000)} ARS.`
  return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeMsg(msg)}`
}

export function linkClienteSuspendido(telefono: string, bizName: string): string {
  const msg = `❌ Tu sitio *${bizName}* fue dado de baja por falta de pago. Para reactivarlo abonás ${formatARS(50000)} ARS de mantenimiento + ${formatARS(50000)} ARS de reactivación.`
  return `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeMsg(msg)}`
}

// ─────────────────────────────────────────────
// Envío server-side (cron jobs / webhooks)
// ─────────────────────────────────────────────

export interface EnvioResult {
  ok: boolean
  via: 'meta-api' | 'log-only'
  error?: string
}

/**
 * Envía un mensaje de WhatsApp server-side.
 *
 * Requiere en .env.local:
 *   WHATSAPP_API_TOKEN   = Bearer token de Meta Cloud API
 *   WHATSAPP_PHONE_ID    = Phone Number ID del número remitente
 *
 * Si no están configurados, loggea el link wa.me para envío manual.
 */
export async function enviarMensaje(telefono: string, mensaje: string): Promise<EnvioResult> {
  const token   = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const numero  = telefono.replace(/\D/g, '')

  // ── Modo Meta Cloud API ───────────────────────────────────────────────────
  if (token && phoneId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: numero,
            type: 'text',
            text: { body: mensaje },
          }),
        }
      )

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Meta API ${res.status}: ${errBody}`)
      }

      return { ok: true, via: 'meta-api' }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error('[whatsapp] Error Meta Cloud API:', error)
      return { ok: false, via: 'meta-api', error }
    }
  }

  // ── Modo fallback: log para envío manual ─────────────────────────────────
  const waUrl = `https://wa.me/${numero}?text=${encodeMsg(mensaje)}`
  console.info('[whatsapp] ENVIAR MANUALMENTE:', { numero, mensaje, waUrl })
  return { ok: true, via: 'log-only' }
}
