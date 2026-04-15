import { NextRequest, NextResponse } from 'next/server'
import { generateCopy } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase'
import type { CopyData, DbLanding } from '@/types/database'

// Bloques válidos según el sistema
const VALID_BLOCKS = ['hero', 'services', 'about', 'testimonials', 'gallery', 'pricing', 'faq', 'contact'] as const
type ValidBlock = (typeof VALID_BLOCKS)[number]

// ─────────────────────────────────────────────
// Validación de entrada
// ─────────────────────────────────────────────

interface GenerateCopyBody {
  bizName: string
  rubro: string
  desc: string
  cta: string
  phone?: string
  activeBlocks: ValidBlock[]
  /** ID de una landing ya creada — habilita caché por sesión y límite de regeneraciones */
  landingId?: string
}

function validateBody(body: unknown): GenerateCopyBody | string {
  if (!body || typeof body !== 'object') return 'El cuerpo de la solicitud es inválido'

  const b = body as Record<string, unknown>

  if (!b.bizName || typeof b.bizName !== 'string' || b.bizName.trim().length === 0)
    return 'bizName es requerido'

  if (!b.rubro || typeof b.rubro !== 'string' || b.rubro.trim().length === 0)
    return 'rubro es requerido'

  if (!b.desc || typeof b.desc !== 'string' || b.desc.trim().length < 10)
    return 'desc es requerido (mínimo 10 caracteres)'

  if (!b.cta || typeof b.cta !== 'string' || b.cta.trim().length === 0)
    return 'cta es requerido'

  if (!Array.isArray(b.activeBlocks) || b.activeBlocks.length === 0)
    return 'activeBlocks debe ser un array no vacío'

  const invalidBlocks = (b.activeBlocks as unknown[]).filter(
    (bl) => !VALID_BLOCKS.includes(bl as ValidBlock)
  )
  if (invalidBlocks.length > 0)
    return `Bloques inválidos: ${invalidBlocks.join(', ')}. Válidos: ${VALID_BLOCKS.join(', ')}`

  return {
    bizName: (b.bizName as string).trim(),
    rubro: (b.rubro as string).trim(),
    desc: (b.desc as string).trim(),
    cta: (b.cta as string).trim(),
    phone: typeof b.phone === 'string' ? b.phone.trim() : undefined,
    activeBlocks: b.activeBlocks as ValidBlock[],
    landingId: typeof b.landingId === 'string' ? b.landingId : undefined,
  }
}

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parsear body
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido en el cuerpo de la solicitud' }, { status: 400 })
  }

  // 2. Validar campos
  const validated = validateBody(rawBody)
  if (typeof validated === 'string') {
    return NextResponse.json({ error: validated }, { status: 400 })
  }

  const { bizName, rubro, desc, cta, activeBlocks, landingId } = validated
  const supabase = createServiceClient()

  // 3. Si se proporcionó landingId, verificar límite de regeneración
  //    Regla: copy_data existe (ya generó una vez) + edited_copy existe (ya usó la regeneración) → bloqueado
  if (landingId) {
    const { data: landing, error: landingError } = await supabase
      .from('landings')
      .select('copy_data, edited_copy')
      .eq('id', landingId)
      .maybeSingle()

    if (landingError) {
      console.error('[generate-copy] Error al verificar landing:', landingError)
      return NextResponse.json({ error: 'Error interno al verificar el estado del pedido' }, { status: 500 })
    }

    const row = landing as Pick<DbLanding, 'copy_data' | 'edited_copy'> | null
    if (row?.copy_data && row?.edited_copy) {
      return NextResponse.json(
        {
          error:
            'Solo se permite 1 regeneración gratuita por sesión. Editá el texto directamente en el editor.',
        },
        { status: 429 }
      )
    }
  }

  // 4. Caché global: si bizName+rubro ya fue generado, reutilizar (costo = $0)
  //    Solo aplica en la primera generación (sin landingId)
  let copyData: CopyData | null = null

  if (!landingId) {
    const { data: cached } = await supabase
      .from('landings')
      .select('copy_data')
      .eq('business_name', bizName)
      .eq('rubro', rubro)
      .not('copy_data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached) {
      const cachedRow = cached as Pick<DbLanding, 'copy_data'>
      if (cachedRow.copy_data) copyData = cachedRow.copy_data
    }
  }

  // 5. Llamar a Claude Haiku si no hay resultado en caché
  if (!copyData) {
    try {
      copyData = await generateCopy({ bizName, rubro, desc, cta, activeBlocks })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar el copy'
      console.error('[generate-copy] Claude error:', err)
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  // 6. Persistir copy_data en Supabase si hay landingId
  if (landingId) {
    const { error: updateError } = await supabase
      .from('landings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ copy_data: copyData as any })
      .eq('id', landingId)

    if (updateError) {
      // No fallamos: el copy fue generado, el guardado es best-effort
      console.error('[generate-copy] Supabase update error:', updateError)
    }
  }

  return NextResponse.json({ copy: copyData }, { status: 200 })
}
