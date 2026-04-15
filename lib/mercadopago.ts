import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'
import type { DomainType } from '@/types/database'

// ─────────────────────────────────────────────
// Configuración lazy (evita errores en build sin env vars)
// ─────────────────────────────────────────────

let _mpConfig: MercadoPagoConfig | null = null

function getMPConfig(): MercadoPagoConfig {
  if (!_mpConfig) {
    const token = process.env.MP_ACCESS_TOKEN
    if (!token) throw new Error('MP_ACCESS_TOKEN no configurado')
    _mpConfig = new MercadoPagoConfig({ accessToken: token })
  }
  return _mpConfig
}

function getPreApprovalClient() {
  return new PreApproval(getMPConfig())
}

// ─────────────────────────────────────────────
// Lógica de precio según tipo de dominio
// ─────────────────────────────────────────────

export function calcularPrecio(domainType: DomainType): number {
  return domainType === 'own' ? 250_000 : 300_000
}

export const MANTENIMIENTO_MENSUAL = 50_000

// ─────────────────────────────────────────────
// Crear suscripción (preapproval)
// ─────────────────────────────────────────────

export interface CrearPreapprovalInput {
  bizName: string
  domainType: DomainType
  payerEmail: string
  orderId: string        // external_reference para lookup en el webhook
  backUrl?: string
}

export interface PreapprovalCreado {
  id: string            // preapproval_id en MP
  initPoint: string     // URL de pago → redirigir al usuario
  amount: number        // monto cobrado en la primera cuota
}

/**
 * Crea una suscripción en MP con la primera cuota según el tipo de dominio.
 *
 * NOTA: La primera cuota incluye el setup (300k o 250k ARS). A partir del
 * segundo mes el monto cambia a 50.000 ARS. Esto se maneja manualmente desde
 * el panel admin de MP o con un segundo preapproval al activar el servicio.
 */
export async function crearPreapproval(input: CrearPreapprovalInput): Promise<PreapprovalCreado> {
  const { bizName, domainType, payerEmail, orderId, backUrl } = input
  const amount = calcularPrecio(domainType)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://volontedev.com'

  const client = getPreApprovalClient()

  const response = await client.create({
    body: {
      reason: `VolonteDev — sitio web ${bizName}`,
      external_reference: orderId,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'ARS',
      },
      back_url: backUrl ?? `${appUrl}/gracias?order=${orderId}`,
      status: 'pending',
    },
  })

  if (!response.id || !response.init_point) {
    throw new Error(`MP no devolvió id o init_point. Response: ${JSON.stringify(response)}`)
  }

  return {
    id: response.id,
    initPoint: response.init_point,
    amount,
  }
}

// ─────────────────────────────────────────────
// Obtener suscripción
// ─────────────────────────────────────────────

export async function obtenerPreapproval(preapprovalId: string) {
  const client = getPreApprovalClient()
  return client.get({ id: preapprovalId })
}

// ─────────────────────────────────────────────
// Actualizar suscripción (suspender / reactivar / cambiar monto)
// ─────────────────────────────────────────────

export type PreapprovalStatus = 'authorized' | 'paused' | 'cancelled'

export async function actualizarPreapproval(
  preapprovalId: string,
  updates: { status?: PreapprovalStatus; amount?: number }
) {
  const client = getPreApprovalClient()

  const body: Record<string, unknown> = {}
  if (updates.status) body.status = updates.status
  if (updates.amount !== undefined) {
    body.auto_recurring = { transaction_amount: updates.amount, currency_id: 'ARS' }
  }

  return client.update({ id: preapprovalId, body })
}

/**
 * Pausa la suscripción (equivale a suspensión por mora).
 * El sitio queda inaccesible pero el preapproval sigue existiendo.
 */
export async function pausarPreapproval(preapprovalId: string) {
  return actualizarPreapproval(preapprovalId, { status: 'paused' })
}

/**
 * Reactiva la suscripción y ajusta el monto al mantenimiento mensual.
 */
export async function reactivarPreapproval(preapprovalId: string) {
  return actualizarPreapproval(preapprovalId, {
    status: 'authorized',
    amount: MANTENIMIENTO_MENSUAL,
  })
}

/**
 * Cancela definitivamente la suscripción.
 */
export async function cancelarPreapproval(preapprovalId: string) {
  return actualizarPreapproval(preapprovalId, { status: 'cancelled' })
}

// ─────────────────────────────────────────────
// Validación de firma del webhook
// ─────────────────────────────────────────────

export interface WebhookHeaders {
  xSignature: string | null       // x-signature: ts=...,v1=...
  xRequestId: string | null       // x-request-id
}

export interface WebhookSignatureResult {
  valid: boolean
  reason?: string
}

/**
 * Valida la firma HMAC-SHA256 del webhook de Mercado Pago.
 *
 * El encabezado x-signature tiene el formato: ts=<timestamp>,v1=<hmac>
 * El string firmado es: id:<notificationId>;request-id:<xRequestId>;ts:<ts>;
 *
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function validarFirmaWebhook(
  notificationId: string | number,
  headers: WebhookHeaders
): WebhookSignatureResult {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    return { valid: false, reason: 'MP_WEBHOOK_SECRET no configurado' }
  }

  const { xSignature, xRequestId } = headers
  if (!xSignature) {
    return { valid: false, reason: 'Falta encabezado x-signature' }
  }

  // Parsear ts y v1 del encabezado
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    return { valid: false, reason: 'Formato de x-signature inválido' }
  }

  // Construir el string a firmar
  const manifest = [
    `id:${notificationId}`,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ]
    .filter(Boolean)
    .join(';') + ';'

  // Calcular HMAC-SHA256
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  // Comparación en tiempo constante (evita timing attacks)
  let valid: boolean
  try {
    valid = timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return { valid: false, reason: 'Error al comparar firmas (longitud inválida)' }
  }

  return valid ? { valid: true } : { valid: false, reason: 'Firma no coincide' }
}
