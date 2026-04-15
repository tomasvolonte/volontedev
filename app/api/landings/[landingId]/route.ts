import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { CopyData } from '@/types/database'

type Params = { params: Promise<{ landingId: string }> }

// ─── GET /api/landings/[landingId] ───────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { landingId } = await params

  if (!landingId) {
    return NextResponse.json({ error: 'landingId requerido' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('landings')
    .select('*')
    .eq('id', landingId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// ─── PATCH /api/landings/[landingId] ─────────────────────────────────────────
// Solo permite actualizar edited_copy (nunca copy_data original)

export async function PATCH(req: NextRequest, { params }: Params) {
  const { landingId } = await params

  if (!landingId) {
    return NextResponse.json({ error: 'landingId requerido' }, { status: 400 })
  }

  let body: { edited_copy: CopyData | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Solo aceptamos edited_copy — nunca copy_data ni status
  if (!('edited_copy' in body)) {
    return NextResponse.json({ error: 'Solo se puede actualizar edited_copy' }, { status: 400 })
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  // Verificar que la landing existe y no está suspendida
  const { data: landing } = await supabase
    .from('landings')
    .select('status')
    .eq('id', landingId)
    .maybeSingle()

  if (!landing) {
    return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
  }
  if (landing.status === 'suspended') {
    return NextResponse.json(
      { error: 'El sitio está suspendido por falta de pago. Regularizá el pago para volver a editarlo.' },
      { status: 403 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('landings')
    .update({ edited_copy: body.edited_copy as unknown as null })
    .eq('id', landingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
