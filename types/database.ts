export type DomainType = 'subdomain' | 'own' | 'new'
export type LandingStatus = 'draft' | 'paid' | 'published' | 'suspended'
export type OrderStatus = 'pending' | 'active' | 'suspended' | 'cancelled'
export type ChangeRequestStatus = 'pending' | 'in_progress' | 'done'
export type NotificationType =
  | 'payment_confirmed'
  | 'overdue_1'
  | 'overdue_2'
  | 'suspended'
  | 'published'
  | 'reactivated'

export type Template = 'minimal' | 'bold' | 'elegant' | 'dark' | 'warm' | 'corporate'

// ─────────────────────────────────────────────
// Copy generado por Claude Haiku
// ─────────────────────────────────────────────

export interface ServiceItem {
  icon: string
  title: string
  desc: string
}

export interface Testimonial {
  name: string
  text: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface CopyData {
  headline: string
  subheadline: string
  about: string
  cta_text: string
  services: ServiceItem[]
  testimonials: Testimonial[]
  faq: FaqItem[]
}

// ─────────────────────────────────────────────
// Tipos de filas (usados en la app directamente)
// ─────────────────────────────────────────────

export interface DbUser {
  id: string
  email: string
  phone: string | null
  created_at: string
}

export interface DbLanding {
  id: string
  user_id: string
  business_name: string
  rubro: string | null
  template: Template
  active_blocks: string[] | null
  copy_data: CopyData | null
  edited_copy: CopyData | null
  accent_color: string
  status: LandingStatus
  domain_type: DomainType | null
  domain_value: string | null
  domain_notes: string | null
  published_url: string | null
  created_at: string
  updated_at: string
}

export interface DbOrder {
  id: string
  user_id: string
  landing_id: string
  domain_type: DomainType
  domain_value: string | null
  first_payment_ars: number
  monthly_fee_ars: number
  mp_subscription_id: string | null
  mp_preapproval_id: string | null
  status: OrderStatus
  last_payment_date: string | null
  next_due_date: string | null
  overdue_notif_1_sent: boolean
  overdue_notif_2_sent: boolean
  suspended_at: string | null
  created_at: string
}

export interface DbChangeRequest {
  id: string
  user_id: string
  landing_id: string
  description: string | null
  status: ChangeRequestStatus
  created_at: string
}

export interface DbNotificationLog {
  id: string
  order_id: string
  type: NotificationType
  sent_at: string
}

// ─────────────────────────────────────────────
// Tipo Database — estructura exacta que espera @supabase/supabase-js
// ─────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser
        Insert: Omit<DbUser, 'id' | 'created_at'>
        Update: Partial<Omit<DbUser, 'id' | 'created_at'>>
        Relationships: []
      }
      landings: {
        Row: DbLanding
        Insert: Omit<DbLanding, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DbLanding, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [
          { foreignKeyName: 'landings_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      orders: {
        Row: DbOrder
        Insert: Omit<DbOrder, 'id' | 'created_at'>
        Update: Partial<Omit<DbOrder, 'id' | 'created_at'>>
        Relationships: [
          { foreignKeyName: 'orders_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'orders_landing_id_fkey'; columns: ['landing_id']; referencedRelation: 'landings'; referencedColumns: ['id'] }
        ]
      }
      change_requests: {
        Row: DbChangeRequest
        Insert: Omit<DbChangeRequest, 'id' | 'created_at'>
        Update: Partial<Omit<DbChangeRequest, 'id' | 'created_at'>>
        Relationships: [
          { foreignKeyName: 'change_requests_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
          { foreignKeyName: 'change_requests_landing_id_fkey'; columns: ['landing_id']; referencedRelation: 'landings'; referencedColumns: ['id'] }
        ]
      }
      notifications_log: {
        Row: DbNotificationLog
        Insert: Omit<DbNotificationLog, 'id' | 'sent_at'>
        Update: never
        Relationships: [
          { foreignKeyName: 'notifications_log_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
