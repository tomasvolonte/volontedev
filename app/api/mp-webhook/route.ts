import { NextRequest, NextResponse } from 'next/server'
import { validarFirmaWebhook, obtenerPreapproval } from '@/lib/mercadopago'
import { linkOperadorNuevoPedido } from '@/lib/whatsapp'
import { createServiceClient } from '@/lib/supabase'
import type { DbOrder } from '@/types/database'

// MP envía GET para verificar que el endpoint existe
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  // ── 1. Leer body raw para validación de firma ──────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // ── 2. Validar firma HMAC-SHA256 ───────────────────────────────────────────
  const notificationId = body.id as string | number | undefined
  if (!notificationId) {
    return NextResponse.json({ error: 'Falta id en el payload' }, { status: 400 })
  }

  const signatureResult = validarFirmaWebhook(notificationId, {
    xSignature: req.headers.get('x-signature'),
    xRequestId: req.headers.get('x-request-id'),
  })

  if (!signatureResult.valid) {
    console.warn('[mp-webhook] Firma inválida:', signatureResult.reason, {
      id: notificationId,
      xSignature: req.headers.get('x-signature'),
    })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  // ── 3. Filtrar tipos de evento relevantes ──────────────────────────────────
  const type = body.type as string | undefined
  const action = body.action as string | undefined
  const dataId = (body.data as Record<string, string> | undefined)?.id

  if (!dataId) {
    // Evento de prueba o sin data — respondemos 200 para que MP no reintente
    return NextResponse.json({ received: true })
  }

  // Tipos que nos interesan:
  //   subscription_authorized_payment → cobro exitoso de cuota
  //   subscription_preapproval → cambio de estado de la suscripción
  const isPayment = type === 'subscription_authorized_payment'
  const isPreapproval = type === 'subscription_preapproval'

  if (!isPayment && !isPreapproval) {
    return NextResponse.json({ received: true, skipped: true })
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    console.error('[mp-webhook] Supabase no configurado')
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  // ── 4. Obtener preapproval de MP para tener external_reference ─────────────
  let preapprovalId: string
  let mpStatus: string | undefined

  if (isPayment) {
    // Para pagos autorizados, dataId es el payment_id. Necesitamos buscar
    // el preapproval por external_reference en nuestra DB (no hay endpoint
    // directo en la v2 SDK para buscar por payment_id en suscripciones).
    // Workaround: buscamos por el preapproval_id guardado en la orden.
    // Por ahora procesamos el event de preapproval también (action: updated → authorized)
    preapprovalId = dataId
    mpStatus = 'authorized'
  } else {
    // Para subscription_preapproval, dataId es el preapproval_id directamente
    preapprovalId = dataId
    try {
      const mp = await obtenerPreapproval(preapprovalId)
      mpStatus = mp.status
    } catch (err) {
      console.error('[mp-webhook] Error al obtener preapproval de MP:', err)
      return NextResponse.json({ error: 'Error al consultar MP' }, { status: 502 })
    }
  }

  // ── 5. Buscar la orden por mp_preapproval_id o mp_subscription_id ──────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, landings(*), users(*)')
    .or(`mp_preapproval_id.eq.${preapprovalId},mp_subscription_id.eq.${preapprovalId}`)
    .maybeSingle()

  if (orderError) {
    console.error('[mp-webhook] Error al buscar orden:', orderError)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  if (!order) {
    // Puede ser una notificación de un pago de prueba o de otra integración
    console.warn('[mp-webhook] Orden no encontrada para preapprovalId:', preapprovalId)
    return NextResponse.json({ received: true, orderFound: false })
  }

  const dbOrder = order as DbOrder & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    landings: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users: any
  }

  // ── 6. Verificar idempotencia: no procesar notificaciones duplicadas ────────
  const { data: existingLog } = await supabase
    .from('notifications_log')
    .select('id')
    .eq('order_id', dbOrder.id)
    .eq('type', 'payment_confirmed')
    .maybeSingle()

  // ── 7. Procesar según estado de MP ────────────────────────────────────────

  if (mpStatus === 'authorized' && !existingLog) {
    await procesarPagoConfirmado(supabase, dbOrder)
  } else if (mpStatus === 'cancelled') {
    await procesarCancelacion(supabase, dbOrder)
  } else if (mpStatus === 'paused') {
    // Pausa iniciada desde el panel de MP (ej: tarjeta rechazada varias veces)
    console.info('[mp-webhook] Suscripción pausada por MP:', preapprovalId)
  }

  return NextResponse.json({ received: true, action: mpStatus })
}

// ─────────────────────────────────────────────
// Acciones
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function procesarPagoConfirmado(supabase: any, order: any) {
  const now = new Date()
  const nextDue = new Date(now)
  nextDue.setDate(nextDue.getDate() + 30)

  // 1. Actualizar orden
  await supabase
    .from('orders')
    .update({
      status: 'active',
      last_payment_date: now.toISOString(),
      next_due_date: nextDue.toISOString(),
      // Resetear flags de mora en caso de reactivación
      overdue_notif_1_sent: false,
      overdue_notif_2_sent: false,
      suspended_at: null,
    })
    .eq('id', order.id)

  // 2. Actualizar landing
  await supabase
    .from('landings')
    .update({ status: 'paid' })
    .eq('id', order.landing_id)

  // 3. Registrar en log (idempotencia)
  await supabase
    .from('notifications_log')
    .insert({ order_id: order.id, type: 'payment_confirmed' })

  // 4. Generar link de WhatsApp al operador
  //    (Se loggea en consola — en producción podría abrirse via redirect o
  //     enviarse via WhatsApp Business API si se tiene acceso)
  const waLink = linkOperadorNuevoPedido({
    clienteNombre: order.users?.email ?? 'Sin nombre',
    clienteTelefono: order.users?.phone ?? 'Sin teléfono',
    clienteEmail: order.users?.email ?? '',
    bizName: order.landings?.business_name ?? '',
    montoCobrado: order.first_payment_ars,
    domainType: order.domain_type,
    domainValue: order.domain_value ?? '',
    template: order.landings?.template ?? '',
    activeBlocks: order.landings?.active_blocks ?? [],
    orderId: order.id,
  })

  console.info('[mp-webhook] ✅ Pago confirmado para orden:', order.id)
  console.info('[mp-webhook] WhatsApp operador:', waLink)

  // 5. Guardar el link del operador en la orden para abrirlo desde el admin
  await supabase
    .from('orders')
    .update({ mp_subscription_id: order.mp_preapproval_id ?? order.mp_subscription_id })
    .eq('id', order.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function procesarCancelacion(supabase: any, order: any) {
  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order.id)

  await supabase
    .from('notifications_log')
    .insert({ order_id: order.id, type: 'suspended' })

  console.info('[mp-webhook] ❌ Suscripción cancelada para orden:', order.id)
}
