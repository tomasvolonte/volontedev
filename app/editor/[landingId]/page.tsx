import { notFound } from 'next/navigation'
import InlineEditor from '@/components/editor/InlineEditor'
import type { DbLanding } from '@/types/database'

// Forzar renderizado dinámico (necesita Supabase en runtime, no en build)
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ landingId: string }>
}

async function getLanding(landingId: string): Promise<DbLanding | null> {
  try {
    const { createServiceClient } = await import('@/lib/supabase')
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('landings')
      .select('*')
      .eq('id', landingId)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as DbLanding
  } catch {
    return null
  }
}

export default async function EditorPage({ params }: Props) {
  const { landingId } = await params
  const landing = await getLanding(landingId)

  if (!landing) {
    notFound()
  }

  // Bloquear edición si el sitio está suspendido
  if (landing.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold text-gray-900">Sitio suspendido</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Este sitio está suspendido por falta de pago. Para volver a editarlo y que siga en línea,
            regularizá el pago del mantenimiento mensual.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    )
  }

  // Si no tiene copy_data todavía, mostrar estado vacío
  if (!landing.copy_data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
          <div className="text-5xl">✨</div>
          <h1 className="text-xl font-bold text-gray-900">Primero generá el contenido</h1>
          <p className="text-gray-600 text-sm">
            Esta landing todavía no tiene contenido generado. Volvé al wizard para crear el copy con IA.
          </p>
          <a
            href="/crear"
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
          >
            Ir al wizard
          </a>
        </div>
      </div>
    )
  }

  return <InlineEditor landing={landing} />
}
