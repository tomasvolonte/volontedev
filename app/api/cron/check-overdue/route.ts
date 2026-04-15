import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { enviarMensaje, linkOperadorSuspension } from '@/lib/whatsapp'
import { pausarPreapproval } from '@/lib/mercadopago'

// ─────────────────────────────────────────────
// Seguridad: solo Vercel Cron puede llamar este endpoint
// Vercel inyecta automáticamente Authorization: Bearer {CRON_SECRET}
// ─────────────────────────────────────────────

function autorizarCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Si no hay secret configurado, solo permitir en desarrollo local
    return process.env.NODE_ENV !== 'production'
  }
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

// ─────────────────────────────────────────────
// Helpers de fecha
// ─────────────────────────────────────────────

/** Días calendario entre dos fechas (from → to, positivo si to > from) */
function diffDias(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((to.getTime() - from.getTime()) / msPerDay)
}

// ─────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────

interface OrderConRelaciones {
  id: string
  landing_id: string
  status: string
  next_due_date: string
  overdue_notif_1_sent: boolean
  overdue_notif_2_sent: boolean
  suspended_at: string | null
  mp_preapproval_id: string | null
  mp_subscription_id: string | null
  first_payment_ars: number
  users: { email: string; phone: string | null } | null
  landings: {
    business_name: string
    published_url: string | null
    status: string
    template: string
    active_blocks: string[] | null
  } | null
}

// ─────────────────────────────────────────────
// Procesamiento por orden
// ─────────────────────────────────────────────

interface ProcessResult {
  orderId: string
  diasMora: number
  actions: string[]
  errors: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function procesarOrdenMorosa(supabase: any, order: OrderConRelaciones, hoy: Date): Promise<ProcessResult> {
  const result: ProcessResult = {
    orderId: order.id,
    diasMora: diffDias(new Date(order.next_due_date), hoy),
    actions: [],
    errors: [],
  }

  const { diasMora } = result
  const bizName = order.landings?.business_name ?? 'tu sitio'
  const clientePhone = order.users?.phone ?? ''
  const clienteNombre = order.users?.email ?? 'Cliente'

  // ── Aviso día 1 de mora ───────────────────────────────────────────────────
  if (diasMora >= 1 && !order.overdue_notif_1_sent) {
    const msg = `⚠️ Hola! Tu sitio ${bizName} tiene el pago de mantenimiento vencido. Abonalo para evitar la suspensión. Monto: $50.000 ARS`

    if (clientePhone) {
      const envio = await enviarMensaje(clientePhone, msg)
      if (!envio.ok) result.errors.push(`mora1_wa: ${envio.error}`)
    }

    const { error } = await supabase
      .from('orders')
      .update({ overdue_notif_1_sent: true })
      .eq('id', order.id)

    if (error) {
      result.errors.push(`mora1_db: ${error.message}`)
    } else {
      result.actions.push('aviso_mora_1_enviado')
    }

    // Log en notifications_log para trazabilidad
    await supabase.from('notifications_log').insert({ order_id: order.id, type: 'overdue_1' })
  }

  // ── Aviso día 3 de mora ───────────────────────────────────────────────────
  if (diasMora >= 3 && !order.overdue_notif_2_sent) {
    const msg = `🚨 Último aviso: tu sitio ${bizName} se dará de baja en 2 días si no regularizás el pago de $50.000 ARS.`

    if (clientePhone) {
      const envio = await enviarMensaje(clientePhone, msg)
      if (!envio.ok) result.errors.push(`mora2_wa: ${envio.error}`)
    }

    const { error } = await supabase
      .from('orders')
      .update({ overdue_notif_2_sent: true })
      .eq('id', order.id)

    if (error) {
      result.errors.push(`mora2_db: ${error.message}`)
    } else {
      result.actions.push('aviso_mora_2_enviado')
    }

    await supabase.from('notifications_log').insert({ order_id: order.id, type: 'overdue_2' })
  }

  // ── Suspensión día 5 de mora ──────────────────────────────────────────────
  if (diasMora >= 5 && order.status !== 'suspended') {
    const now = new Date()

    // 1. Suspender en DB
    const [{ error: orderErr }, { error: landingErr }] = await Promise.all([
      supabase
        .from('orders')
        .update({ status: 'suspended', suspended_at: now.toISOString() })
        .eq('id', order.id),
      supabase
        .from('landings')
        .update({ status: 'suspended' })
        .eq('id', order.landing_id),
    ])

    if (orderErr) result.errors.push(`suspension_order: ${orderErr.message}`)
    if (landingErr) result.errors.push(`suspension_landing: ${landingErr.message}`)

    // 2. Pausar preapproval en Mercado Pago
    const preapprovalId = order.mp_preapproval_id ?? order.mp_subscription_id
    if (preapprovalId) {
      try {
        await pausarPreapproval(preapprovalId)
        result.actions.push('mp_preapproval_pausado')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`mp_pause: ${msg}`)
        // No fallamos el cron por esto — la suspensión en DB ya quedó registrada
      }
    }

    // 3. Notificar al operador para que baje el sitio de Hostinger
    const waOperador = linkOperadorSuspension({
      clienteNombre,
      clienteTelefono: clientePhone,
      bizName,
      publishedUrl: order.landings?.published_url ?? '(sin URL)',
      diasMora,
      orderId: order.id,
    })
    // El link se loggea; en producción con WhatsApp Business API se enviaría al OPERATOR_WA_NUMBER
    console.info('[cron] Notificar operador:', waOperador)

    // 4. Notificar al cliente
    const msgCliente = `❌ Tu sitio ${bizName} fue dado de baja por falta de pago. Para reactivarlo abonás $50.000 ARS de mantenimiento + $50.000 ARS de reactivación.`
    if (clientePhone) {
      const envio = await enviarMensaje(clientePhone, msgCliente)
      if (!envio.ok) result.errors.push(`suspension_wa_cliente: ${envio.error}`)
    }

    // 5. Log
    await supabase.from('notifications_log').insert({ order_id: order.id, type: 'suspended' })

    result.actions.push('orden_suspendida', 'landing_suspendida', 'cliente_notificado')
  }

  return result
}

// ─────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Autorización ────────────────────────────────────────────────────────
  if (!autorizarCron(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const startedAt = Date.now()
  console.info('[cron/check-overdue] Iniciando — ' + new Date().toISOString())

  // ── Supabase ─────────────────────────────────────────────────────────────
  let supabase
  try {
    supabase = createServiceClient()
  } catch (err) {
    console.error('[cron] Supabase no configurado:', err)
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  // ── Buscar órdenes activas con next_due_date en el pasado ────────────────
  const hoy = new Date()

  const { data: overdueOrders, error: queryError } = await supabase
    .from('orders')
    .select(`
      id,
      landing_id,
      status,
      next_due_date,
      overdue_notif_1_sent,
      overdue_notif_2_sent,
      suspended_at,
      mp_preapproval_id,
      mp_subscription_id,
      first_payment_ars,
      users ( email, phone ),
      landings ( business_name, published_url, status, template, active_blocks )
    `)
    .eq('status', 'active')
    .lt('next_due_date', hoy.toISOString())

  if (queryError) {
    console.error('[cron] Error al consultar órdenes:', queryError)
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  const orders = (overdueOrders ?? []) as unknown as OrderConRelaciones[]
  console.info(`[cron] Órdenes vencidas encontradas: ${orders.length}`)

  if (orders.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      durationMs: Date.now() - startedAt,
      timestamp: hoy.toISOString(),
    })
  }

  // ── Procesar cada orden (uno por uno para evitar rate limits de MP/WA) ───
  const results: ProcessResult[] = []
  const errores: string[] = []

  for (const order of orders) {
    try {
      const result = await procesarOrdenMorosa(supabase, order, hoy)
      results.push(result)

      const emoji = result.errors.length > 0 ? '⚠️' : '✅'
      console.info(`[cron] ${emoji} Orden ${order.id} | mora ${result.diasMora}d | acciones: ${result.actions.join(', ') || 'ninguna'}`)
      if (result.errors.length > 0) {
        console.warn(`[cron] Errores en ${order.id}:`, result.errors)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errores.push(`${order.id}: ${msg}`)
      console.error(`[cron] Error inesperado en orden ${order.id}:`, err)
    }
  }

  const duracion = Date.now() - startedAt
  console.info(`[cron/check-overdue] Finalizado en ${duracion}ms`)

  return NextResponse.json({
    ok: true,
    processed: orders.length,
    results,
    cronErrors: errores,
    durationMs: duracion,
    timestamp: hoy.toISOString(),
  })
}
