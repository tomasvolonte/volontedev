'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface AdminOrder {
  id: string
  status: 'pending' | 'active' | 'suspended' | 'cancelled'
  domain_type: 'subdomain' | 'own' | 'new'
  domain_value: string | null
  first_payment_ars: number
  monthly_fee_ars: number
  next_due_date: string | null
  last_payment_date: string | null
  suspended_at: string | null
  overdue_notif_1_sent: boolean
  overdue_notif_2_sent: boolean
  mp_preapproval_id: string | null
  created_at: string
  landing_id: string
  landing_status: 'draft' | 'paid' | 'published' | 'suspended'
  business_name: string
  template: string
  published_url: string | null
  client_email: string
  client_phone: string | null
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-600',
  active:    'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
  paid:      'bg-indigo-100 text-indigo-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  active:    'Activo',
  published: 'Publicado',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
  paid:      'Pagado',
}

const DOMAIN_LABEL: Record<string, string> = {
  subdomain: 'Subdominio',
  own:       'Dominio propio',
  new:       'Dominio nuevo',
}

// ─────────────────────────────────────────────
// Modal de publicación
// ─────────────────────────────────────────────

function PublishModal({
  order,
  onClose,
  onSuccess,
}: {
  order: AdminOrder
  onClose: () => void
  onSuccess: (orderId: string, url: string, waLink: string | null) => void
}) {
  const defaultUrl = order.domain_type === 'subdomain' && order.domain_value
    ? `https://${order.domain_value}.volontedev.com`
    : order.domain_value ? `https://${order.domain_value}` : ''

  const [url, setUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', publishedUrl: url }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      onSuccess(order.id, url, json.waCliente)
    } catch { setError('Error de red') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900">Publicar sitio</h2>
        <p className="text-sm text-gray-600">
          Ingresá la URL donde quedó publicado <strong>{order.business_name}</strong> en Hostinger.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            placeholder="https://mi-negocio.com.ar"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠️ {error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !url}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              {loading ? 'Publicando…' : 'Confirmar publicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Modal de WhatsApp post-acción
// ─────────────────────────────────────────────

function WaModal({ link, label, onClose }: { link: string; label: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-4xl">💬</div>
        <h2 className="text-lg font-bold text-gray-900">{label}</h2>
        <p className="text-sm text-gray-600">
          Hacé clic para abrir WhatsApp con el mensaje pre-armado para el cliente.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
            Cerrar
          </button>
          <a href={link} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Fila de la tabla
// ─────────────────────────────────────────────

function OrderRow({
  order,
  onAction,
}: {
  order: AdminOrder
  onAction: (order: AdminOrder, action: 'publish' | 'suspend' | 'reactivate') => void
}) {
  const domainDisplay = order.domain_type === 'subdomain' && order.domain_value
    ? `${order.domain_value}.volontedev.com`
    : order.domain_value ?? '—'

  const diasMora = order.next_due_date && order.status === 'active'
    ? Math.floor((Date.now() - new Date(order.next_due_date).getTime()) / 86_400_000)
    : null

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Negocio */}
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 text-sm">{order.business_name}</p>
        <p className="text-xs text-gray-400 capitalize">{order.template}</p>
      </td>

      {/* Cliente */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{order.client_email}</p>
        {order.client_phone && (
          <a href={`tel:${order.client_phone}`} className="text-xs text-indigo-600 hover:underline">
            {order.client_phone}
          </a>
        )}
      </td>

      {/* Dominio */}
      <td className="px-4 py-3">
        <span className="text-xs font-medium text-gray-500 block">{DOMAIN_LABEL[order.domain_type]}</span>
        <p className="text-sm text-gray-700 font-mono break-all">{domainDisplay}</p>
        {order.published_url && (
          <a href={order.published_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-green-600 hover:underline">
            Ver sitio ↗
          </a>
        )}
      </td>

      {/* Monto */}
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-semibold text-gray-900">{formatARS(order.first_payment_ars)}</p>
        <p className="text-xs text-gray-400">{formatARS(order.monthly_fee_ars)}/mes</p>
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.landing_status] ?? STATUS_BADGE.pending}`}>
          {STATUS_LABEL[order.landing_status] ?? order.landing_status}
        </span>
        {diasMora !== null && diasMora > 0 && (
          <p className="text-xs text-red-500 font-medium mt-1">⚠️ {diasMora}d mora</p>
        )}
        {order.overdue_notif_1_sent && !order.overdue_notif_2_sent && (
          <p className="text-xs text-amber-500 mt-0.5">Aviso 1 enviado</p>
        )}
        {order.overdue_notif_2_sent && (
          <p className="text-xs text-orange-500 mt-0.5">Aviso 2 enviado</p>
        )}
      </td>

      {/* Vencimiento */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatFecha(order.next_due_date)}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5 items-start">
          {order.landing_status === 'paid' && (
            <button
              onClick={() => onAction(order, 'publish')}
              className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              ✓ Publicar
            </button>
          )}
          {(order.landing_status === 'published' || order.status === 'active') && order.status !== 'suspended' && (
            <button
              onClick={() => onAction(order, 'suspend')}
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              ✕ Dar de baja
            </button>
          )}
          {order.status === 'suspended' && (
            <button
              onClick={() => onAction(order, 'reactivate')}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              ↩ Reactivar
            </button>
          )}
          {order.landing_status === 'draft' && (
            <span className="text-xs text-gray-400 italic">Sin pago aún</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function AdminClient({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders)
  const [publishTarget, setPublishTarget] = useState<AdminOrder | null>(null)
  const [waModal, setWaModal] = useState<{ link: string; label: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Actualización optimista del estado de una orden en la tabla
  function updateOrder(orderId: string, patch: Partial<AdminOrder>) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...patch } : o))
  }

  function handleAction(order: AdminOrder, action: 'publish' | 'suspend' | 'reactivate') {
    setActionError(null)
    if (action === 'publish') {
      setPublishTarget(order)
      return
    }
    executeAction(order.id, action)
  }

  async function executeAction(orderId: string, action: 'suspend' | 'reactivate') {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error); return }

    // Actualizar UI
    if (action === 'suspend') {
      updateOrder(orderId, { status: 'suspended', landing_status: 'suspended', suspended_at: new Date().toISOString() })
    } else {
      const nextDue = new Date(); nextDue.setDate(nextDue.getDate() + 30)
      updateOrder(orderId, { status: 'active', landing_status: 'published', suspended_at: null, overdue_notif_1_sent: false, overdue_notif_2_sent: false, next_due_date: nextDue.toISOString() })
      if (json.waCliente) setWaModal({ link: json.waCliente, label: '¡Sitio reactivado!' })
    }
  }

  function handlePublishSuccess(orderId: string, url: string, waLink: string | null) {
    setPublishTarget(null)
    updateOrder(orderId, { landing_status: 'published', published_url: url, status: 'active' })
    if (waLink) setWaModal({ link: waLink, label: '¡Sitio publicado!' })
  }

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    window.location.href = '/admin/login'
  }

  // Stats rápidas
  const stats = {
    total:     orders.length,
    paid:      orders.filter(o => o.landing_status === 'paid').length,
    published: orders.filter(o => o.landing_status === 'published').length,
    suspended: orders.filter(o => o.status === 'suspended').length,
    pending:   orders.filter(o => o.status === 'pending').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-600 text-lg">VolonteDev</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-600">Panel del operador</span>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total pedidos', value: stats.total, color: 'text-gray-900' },
            { label: 'Sin pagar', value: stats.pending, color: 'text-gray-500' },
            { label: 'Listos para publicar', value: stats.paid, color: 'text-indigo-600' },
            { label: 'Publicados', value: stats.published, color: 'text-green-600' },
            { label: 'Suspendidos', value: stats.suspended, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Error global */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-700 flex-1">{actionError}</p>
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Pedidos</h2>
            <span className="text-xs text-gray-400">{orders.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Negocio', 'Cliente', 'Dominio', 'Monto', 'Estado', 'Próx. venc.', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No hay pedidos todavía
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <OrderRow key={order.id} order={order} onAction={handleAction} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modales */}
      {publishTarget && (
        <PublishModal
          order={publishTarget}
          onClose={() => setPublishTarget(null)}
          onSuccess={handlePublishSuccess}
        />
      )}
      {waModal && (
        <WaModal link={waModal.link} label={waModal.label} onClose={() => setWaModal(null)} />
      )}
    </div>
  )
}
