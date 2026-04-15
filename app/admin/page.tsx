import { redirect } from 'next/navigation'
import AdminClient, { type AdminOrder } from './AdminClient'

export const dynamic = 'force-dynamic'

async function getOrders(): Promise<AdminOrder[]> {
  try {
    const { createServiceClient } = await import('@/lib/supabase')
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        domain_type,
        domain_value,
        first_payment_ars,
        monthly_fee_ars,
        next_due_date,
        last_payment_date,
        suspended_at,
        overdue_notif_1_sent,
        overdue_notif_2_sent,
        mp_preapproval_id,
        landing_id,
        created_at,
        users ( email, phone ),
        landings (
          business_name,
          template,
          status,
          published_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row): AdminOrder => ({
      id:                    row.id,
      status:                row.status,
      domain_type:           row.domain_type,
      domain_value:          row.domain_value,
      first_payment_ars:     row.first_payment_ars,
      monthly_fee_ars:       row.monthly_fee_ars,
      next_due_date:         row.next_due_date,
      last_payment_date:     row.last_payment_date,
      suspended_at:          row.suspended_at,
      overdue_notif_1_sent:  row.overdue_notif_1_sent,
      overdue_notif_2_sent:  row.overdue_notif_2_sent,
      mp_preapproval_id:     row.mp_preapproval_id,
      landing_id:            row.landing_id,
      created_at:            row.created_at,
      landing_status:        row.landings?.status ?? 'draft',
      business_name:         row.landings?.business_name ?? '(sin nombre)',
      template:              row.landings?.template ?? '',
      published_url:         row.landings?.published_url ?? null,
      client_email:          row.users?.email ?? '—',
      client_phone:          row.users?.phone ?? null,
    }))
  } catch {
    return []
  }
}

export default async function AdminPage() {
  // Verificación adicional server-side (el middleware ya validó, esto es defensa en profundidad)
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    redirect('/admin/login')
  }

  const orders = await getOrders()
  return <AdminClient initialOrders={orders} />
}
