import { NextRequest, NextResponse } from 'next/server'
import { crearPreapproval, calcularPrecio } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase'
import type { DomainType } from '@/types/database'

interface CheckoutBody {
  landingId: string
  email: string
  phone?: string
  domainType: DomainType
  domainValue: string
}

function validateBody(body: unknown): CheckoutBody | string {
  if (!body || typeof body !== 'object') return 'Cuerpo inválido'
  const b = body as Record<string, unknown>

  if (!b.landingId || typeof b.landingId !== 'string') return 'landingId requerido'
  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@')) return 'email válido requerido'
  if (!b.domainType || !['subdomain', 'own', 'new'].includes(b.domainType as string))
    return 'domainType inválido (subdomain | own | new)'
  if (!b.domainValue || typeof b.domainValue !== 'string' || b.domainValue.trim().length === 0)
    return 'domainValue requerido'

  return {
    landingId: b.landingId,
    email: (b.email as string).trim().toLowerCase(),
    phone: typeof b.phone === 'string' ? b.phone.trim() : undefined,
    domainType: b.domainType as DomainType,
    domainValue: (b.domainValue as string).trim(),
  }
}

export async function POST(req: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const validated = validateBody(rawBody)
  if (typeof validated === 'string') {
    return NextResponse.json({ error: validated }, { status: 400 })
  }

  const { landingId, email, phone, domainType, domainValue } = validated

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  // 1. Verificar que la landing existe y obtener el bizName
  const { data: landing } = await supabase
    .from('landings')
    .select('id, business_name, status, template, active_blocks')
    .eq('id', landingId)
    .maybeSingle()

  if (!landing) {
    return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
  }
  if (landing.status === 'suspended') {
    return NextResponse.json({ error: 'Landing suspendida' }, { status: 403 })
  }

  // 2. Upsert de usuario por email
  const { data: user, error: userError } = await supabase
    .from('users')
    .upsert({ email, phone: phone ?? null }, { onConflict: 'email' })
    .select('id')
    .single()

  if (userError || !user) {
    console.error('[checkout] Error upsert user:', userError)
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }

  // 3. Calcular precio según tipo de dominio
  const firstPaymentArs = calcularPrecio(domainType)

  // 4. Crear orden en Supabase (status: pending — se activa solo con el webhook)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      landing_id: landingId,
      domain_type: domainType,
      domain_value: domainValue,
      first_payment_ars: firstPaymentArs,
      monthly_fee_ars: 50000,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[checkout] Error al crear orden:', orderError)
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 })
  }

  // 5. Crear preapproval en Mercado Pago
  let preapproval
  try {
    preapproval = await crearPreapproval({
      bizName: landing.business_name,
      domainType,
      payerEmail: email,
      orderId: order.id,
    })
  } catch (err) {
    console.error('[checkout] Error al crear preapproval en MP:', err)
    // Limpiar la orden pendiente para evitar basura en DB
    await supabase.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Error al crear el pago en Mercado Pago' }, { status: 502 })
  }

  // 6. Guardar preapproval_id en la orden
  await supabase
    .from('orders')
    .update({ mp_preapproval_id: preapproval.id })
    .eq('id', order.id)

  // 7. Actualizar landing con datos de dominio
  await supabase
    .from('landings')
    .update({ domain_type: domainType, domain_value: domainValue })
    .eq('id', landingId)

  return NextResponse.json({
    orderId: order.id,
    initPoint: preapproval.initPoint,
    amount: preapproval.amount,
  })
}
