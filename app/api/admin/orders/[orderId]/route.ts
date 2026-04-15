import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { linkClienteSitioPublicado } from '@/lib/whatsapp'
import { pausarPreapproval, reactivarPreapproval } from '@/lib/mercadopago'

type Params = { params: Promise<{ orderId: string }> }

type Action = 'publish' | 'suspend' | 'reactivate'

interface ActionBody {
  action: Action
  publishedUrl?: string  // requerido para 'publish'
}

function validateBody(body: unknown): ActionBody | string {
  if (!body || typeof body !== 'object') return 'Cuerpo inválido'
  const b = body as Record<string, unknown>
  const validActions: Action[] = ['publish', 'suspend', 'reactivate']
  if (!b.action || !validActions.includes(b.action as Action))
    return `action debe ser: ${validActions.join(' | ')}`
  if (b.action === 'publish' && (!b.publishedUrl || typeof b.publishedUrl !== 'string' || !b.publishedUrl.startsWith('http')))
    return 'publishedUrl (URL válida con http/https) requerido para publish'
  return { action: b.action as Action, publishedUrl: b.publishedUrl as string | undefined }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { orderId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const validated = validateBody(body)
  if (typeof validated === 'string')
    return NextResponse.json({ error: validated }, { status: 400 })

  const { action, publishedUrl } = validated

  let supabase
  try { supabase = createServiceClient() } catch {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  // Fetch orden + relaciones necesarias
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*, users(email, phone), landings(id, business_name, status, published_url)')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchErr || !order)
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any

  switch (action) {
    // ── PUBLICAR ───────────────────────────────────────────────────────────
    case 'publish': {
      if (!['paid', 'suspended'].includes(o.status))
        return NextResponse.json({ error: `No se puede publicar una orden en estado '${o.status}'` }, { status: 409 })

      const [{ error: orderErr }, { error: landingErr }] = await Promise.all([
        supabase.from('orders').update({ status: 'active' }).eq('id', orderId),
        supabase.from('landings').update({
          status: 'published',
          published_url: publishedUrl,
        }).eq('id', o.landing_id),
      ])

      if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
      if (landingErr) return NextResponse.json({ error: landingErr.message }, { status: 500 })

      await supabase.from('notifications_log').insert({ order_id: orderId, type: 'published' })

      // Generar link WhatsApp para el cliente
      const clientePhone = o.users?.phone ?? ''
      const waCliente = clientePhone
        ? linkClienteSitioPublicado(clientePhone, o.landings?.business_name ?? '', publishedUrl!)
        : null

      return NextResponse.json({ ok: true, waCliente })
    }

    // ── DAR DE BAJA MANUAL ────────────────────────────────────────────────
    case 'suspend': {
      if (o.status === 'suspended')
        return NextResponse.json({ error: 'La orden ya está suspendida' }, { status: 409 })

      const now = new Date().toISOString()
      const [{ error: orderErr }, { error: landingErr }] = await Promise.all([
        supabase.from('orders').update({ status: 'suspended', suspended_at: now }).eq('id', orderId),
        supabase.from('landings').update({ status: 'suspended' }).eq('id', o.landing_id),
      ])

      if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
      if (landingErr) return NextResponse.json({ error: landingErr.message }, { status: 500 })

      // Intentar pausar en MP (best-effort)
      const preapprovalId = o.mp_preapproval_id ?? o.mp_subscription_id
      if (preapprovalId) {
        try { await pausarPreapproval(preapprovalId) } catch (err) {
          console.warn('[admin/suspend] No se pudo pausar preapproval en MP:', err)
        }
      }

      await supabase.from('notifications_log').insert({ order_id: orderId, type: 'suspended' })

      return NextResponse.json({ ok: true })
    }

    // ── REACTIVAR ─────────────────────────────────────────────────────────
    case 'reactivate': {
      if (o.status !== 'suspended')
        return NextResponse.json({ error: `Solo se pueden reactivar órdenes suspendidas (estado actual: '${o.status}')` }, { status: 409 })

      const nextDue = new Date()
      nextDue.setDate(nextDue.getDate() + 30)

      const [{ error: orderErr }, { error: landingErr }] = await Promise.all([
        supabase.from('orders').update({
          status: 'active',
          suspended_at: null,
          overdue_notif_1_sent: false,
          overdue_notif_2_sent: false,
          next_due_date: nextDue.toISOString(),
          last_payment_date: new Date().toISOString(),
        }).eq('id', orderId),
        supabase.from('landings').update({ status: 'published' }).eq('id', o.landing_id),
      ])

      if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
      if (landingErr) return NextResponse.json({ error: landingErr.message }, { status: 500 })

      // Intentar reactivar en MP (best-effort — puede fallar si fue cancelado)
      const preapprovalId = o.mp_preapproval_id ?? o.mp_subscription_id
      if (preapprovalId) {
        try { await reactivarPreapproval(preapprovalId) } catch (err) {
          console.warn('[admin/reactivate] No se pudo reactivar preapproval en MP:', err)
        }
      }

      await supabase.from('notifications_log').insert({ order_id: orderId, type: 'reactivated' })

      // Generar link WhatsApp al cliente avisando reactivación
      const clientePhone = o.users?.phone ?? ''
      const publishedUrl = o.landings?.published_url ?? ''
      const waCliente = clientePhone && publishedUrl
        ? linkClienteSitioPublicado(clientePhone, o.landings?.business_name ?? '', publishedUrl)
        : null

      return NextResponse.json({ ok: true, waCliente })
    }
  }
}
